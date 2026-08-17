// Auth dependency-equivalents: current user + role guards (mirrors deps.py).
"use strict";
const jwt = require("jsonwebtoken");
const { pool } = require("./db");
const { decodeToken } = require("./security");
const { clean } = require("./lib/clean");
const { ApiError } = require("./lib/ApiError");
const asyncHandler = require("./lib/asyncHandler");

async function getCurrentUser(req) {
  let token = req.cookies && req.cookies.access_token;
  if (!token) {
    const auth = req.headers.authorization || "";
    if (auth.startsWith("Bearer ")) token = auth.slice(7);
  }
  if (!token) throw new ApiError(401, "Not authenticated");

  let payload;
  try {
    payload = decodeToken(token);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw new ApiError(401, "Token expired");
    throw new ApiError(401, "Invalid token");
  }
  if (payload.type !== "access") throw new ApiError(401, "Invalid token type");

  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [payload.sub]);
  const user = rows[0];
  if (!user) throw new ApiError(401, "User not found");
  return clean(user);
}

/** Express middleware: attaches req.user, or throws 401. */
const requireAuth = asyncHandler(async (req, res, next) => {
  req.user = await getCurrentUser(req);
  next();
});

/** Express middleware factory: attaches req.user, or throws 401/403. */
function requireRole(...roles) {
  return asyncHandler(async (req, res, next) => {
    const user = await getCurrentUser(req);
    if (!roles.includes(user.role)) throw new ApiError(403, "Insufficient permissions");
    req.user = user;
    next();
  });
}

module.exports = { getCurrentUser, requireAuth, requireRole };
