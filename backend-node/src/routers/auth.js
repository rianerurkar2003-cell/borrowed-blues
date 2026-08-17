// Auth router: /api/auth/*
"use strict";
const express = require("express");
const crypto = require("crypto");
const { pool } = require("../db");
const { newId } = require("../lib/ids");
const { withIsoDates, toIso } = require("../lib/dates");
const { ApiError } = require("../lib/ApiError");
const asyncHandler = require("../lib/asyncHandler");
const { requireAuth } = require("../authMiddleware");
const { sendEmail } = require("../mail");
const config = require("../config");
const {
  hashPassword, verifyPassword,
  createAccessToken, createRefreshToken, decodeToken,
  setAuthCookies, clearAuthCookies,
} = require("../security");
const { validate } = require("../validation/validate");
const {
  RegisterRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest,
} = require("../validation/schemas");

const router = express.Router();

router.post(
  "/register",
  validate(RegisterRequest),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase().trim();
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing[0]) throw new ApiError(400, "Email already registered");

    const userId = newId();
    const now = new Date();
    const role = "client";
    await pool.query(
      "INSERT INTO users (id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, email, hashPassword(req.body.password), req.body.name, role, now],
    );
    const access = createAccessToken(userId, email, role);
    const refresh = createRefreshToken(userId);
    setAuthCookies(res, access, refresh);
    res.json({
      id: userId, email, name: req.body.name, role,
      created_at: now.toISOString(), access_token: access,
    });
  }),
);

router.post(
  "/login",
  validate(LoginRequest),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase().trim();
    const identifier = `email:${email}`;

    const [lockRows] = await pool.query("SELECT * FROM login_attempts WHERE identifier = ?", [identifier]);
    const lock = lockRows[0];
    if (lock && lock.locked_until && new Date(toIso(lock.locked_until)) > new Date()) {
      throw new ApiError(429, "Too many attempts. Try again later.");
    }

    const [userRows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = userRows[0];
    if (!user || !verifyPassword(req.body.password, user.password_hash)) {
      const attempts = (lock ? lock.attempts : 0) + 1;
      const lockedUntil = attempts >= config.LOCKOUT_ATTEMPTS
        ? new Date(Date.now() + config.LOCKOUT_DURATION_MINUTES * 60 * 1000)
        : null;
      await pool.query(
        `INSERT INTO login_attempts (identifier, attempts, locked_until) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE attempts = VALUES(attempts), locked_until = VALUES(locked_until)`,
        [identifier, attempts, lockedUntil],
      );
      throw new ApiError(401, "Invalid email or password");
    }

    await pool.query("DELETE FROM login_attempts WHERE identifier = ?", [identifier]);
    const access = createAccessToken(user.id, user.email, user.role);
    const refresh = createRefreshToken(user.id);
    setAuthCookies(res, access, refresh);
    res.json({
      id: user.id, email: user.email, name: user.name, role: user.role,
      created_at: toIso(user.created_at),
      access_token: access,
    });
  }),
);

router.post("/logout", requireAuth, (req, res) => {
  clearAuthCookies(res);
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json(withIsoDates(req.user));
});

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = req.cookies && req.cookies.refresh_token;
    if (!token) throw new ApiError(401, "No refresh token");

    let payload;
    try {
      payload = decodeToken(token);
    } catch (err) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (payload.type !== "refresh") throw new ApiError(401, "Invalid token type");

    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [payload.sub]);
    const user = rows[0];
    if (!user) throw new ApiError(401, "User not found");

    const access = createAccessToken(user.id, user.email, user.role);
    setAuthCookies(res, access, token);
    res.json({ ok: true });
  }),
);

router.post(
  "/forgot-password",
  validate(ForgotPasswordRequest),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase().trim();
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];
    if (user) {
      const token = crypto.randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await pool.query(
        "INSERT INTO password_reset_tokens (token, user_id, expires_at, used) VALUES (?, ?, ?, 0)",
        [token, user.id, expiresAt],
      );
      const link = `${config.FRONTEND_URL}/reset-password?token=${token}`;
      try {
        await sendEmail(
          user.email,
          "Reset your Borrowed Blues password",
          `<p>Hi ${user.name || ""},</p>` +
            `<p>Use the link below to reset your password. It expires in 1 hour.</p>` +
            `<p><a href="${link}">${link}</a></p>` +
            `<p>If you didn't request this, you can ignore this email.</p>`,
          `Reset your password: ${link}\nThis link expires in 1 hour.`,
        );
      } catch (err) {
        console.error(`Failed to send password reset email to ${user.email}`, err);
      }
    }
    res.json({ ok: true, message: "If that email exists, a reset link has been sent." });
  }),
);

router.post(
  "/reset-password",
  validate(ResetPasswordRequest),
  asyncHandler(async (req, res) => {
    const { token, new_password: newPassword } = req.body;
    const [rows] = await pool.query(
      "SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0",
      [token],
    );
    const rec = rows[0];
    if (!rec || new Date(toIso(rec.expires_at)) < new Date()) {
      throw new ApiError(400, "Invalid or expired token");
    }
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
      hashPassword(newPassword), rec.user_id,
    ]);
    await pool.query("UPDATE password_reset_tokens SET used = 1 WHERE token = ?", [token]);
    res.json({ ok: true });
  }),
);

module.exports = router;
