// Google Calendar OAuth connect/disconnect flow: /api/therapist/google/*
// Mounted separately from routers/therapist.js (rather than under its
// router-wide requireRole gate) because /callback is hit directly by the
// browser on redirect from Google and must never answer with a raw JSON
// error — every outcome there has to be a redirect back into the SPA.
"use strict";
const express = require("express");
const { pool } = require("../db");
const config = require("../config");
const { requireRole, getCurrentUser } = require("../authMiddleware");
const { createOAuthState, verifyOAuthState } = require("../security");
const asyncHandler = require("../lib/asyncHandler");
const google = require("../lib/googleCalendar");

const router = express.Router();

router.get(
  "/status",
  requireRole("therapist"),
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      "SELECT connected_email FROM google_calendar_connections WHERE user_id = ?",
      [req.user.id],
    );
    res.json({ connected: !!rows[0], connected_email: rows[0]?.connected_email || null });
  }),
);

router.get(
  "/auth-url",
  requireRole("therapist"),
  asyncHandler(async (req, res) => {
    if (!google.isConfigured()) {
      return res.status(503).json({ detail: "Google Calendar isn't configured yet." });
    }
    res.json({ url: google.getAuthUrl(createOAuthState()) });
  }),
);

router.get(
  "/callback",
  asyncHandler(async (req, res) => {
    const redirect = (query) => res.redirect(`${config.FRONTEND_URL}/therapist/profile?${query}`);
    try {
      const { code, state } = req.query;
      if (!code || !state) return redirect("google=error");
      verifyOAuthState(state);

      const user = await getCurrentUser(req);
      if (user.role !== "therapist") return redirect("google=error");

      const tokens = await google.exchangeCode(code);
      const email = await google.getUserEmail(tokens.access_token).catch(() => null);
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

      await pool.query(
        `INSERT INTO google_calendar_connections (user_id, access_token, refresh_token, expires_at, connected_email)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE access_token = VALUES(access_token),
           refresh_token = VALUES(refresh_token), expires_at = VALUES(expires_at),
           connected_email = VALUES(connected_email)`,
        [user.id, google.encryptToken(tokens.access_token), google.encryptToken(tokens.refresh_token), expiresAt, email],
      );
      redirect("google=connected");
    } catch (err) {
      console.error("[google/callback] failed:", err.message);
      redirect("google=error");
    }
  }),
);

router.post(
  "/disconnect",
  requireRole("therapist"),
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      "SELECT refresh_token FROM google_calendar_connections WHERE user_id = ?",
      [req.user.id],
    );
    if (rows[0]) await google.revokeToken(google.decryptToken(rows[0].refresh_token));
    await pool.query("DELETE FROM google_calendar_connections WHERE user_id = ?", [req.user.id]);
    res.json({ ok: true });
  }),
);

module.exports = router;
