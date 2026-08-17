// Runtime configuration. Fails fast on missing critical env vars.
"use strict";
require("dotenv").config();

function required(key) {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

const MYSQL_HOST = required("MYSQL_HOST");
const MYSQL_PORT = Number(process.env.MYSQL_PORT || 3306);
const MYSQL_USER = required("MYSQL_USER");
const MYSQL_PASSWORD = required("MYSQL_PASSWORD");
const MYSQL_DATABASE = required("MYSQL_DATABASE");

const JWT_SECRET = required("JWT_SECRET");
const ADMIN_EMAIL = required("ADMIN_EMAIL").toLowerCase();
const ADMIN_PASSWORD = required("ADMIN_PASSWORD");

const CORS_ORIGINS = process.env.CORS_ORIGINS || "*";
// Auth cookies default to production-safe (Secure + SameSite=None, required for
// cross-site HTTPS deployments). Set COOKIE_SECURE=false only for local HTTP dev,
// where SameSite=Lax is used instead (browsers reject SameSite=None without Secure).
const COOKIE_SECURE = (process.env.COOKIE_SECURE || "true").trim().toLowerCase() !== "false";

// Dev/demo fixture data (seed.js): the demo client account and its sample
// appointments/journal/homework/consultation requests. Defaults on for local
// dev. Set SEED_DEMO_DATA=false in production so a fresh deploy only creates
// the real therapist account (above) and stays otherwise empty.
const SEED_DEMO_DATA = (process.env.SEED_DEMO_DATA || "true").trim().toLowerCase() !== "false";
// Only required when SEED_DEMO_DATA is on — production with it disabled
// doesn't need to invent demo-client credentials just to boot.
const CLIENT_SEED_EMAIL = SEED_DEMO_DATA ? required("CLIENT_SEED_EMAIL").toLowerCase() : "";
const CLIENT_SEED_PASSWORD = SEED_DEMO_DATA ? required("CLIENT_SEED_PASSWORD") : "";

// Outbound email (password reset links, etc). Optional: when SMTP_HOST is
// unset, mail.js falls back to logging the message instead of sending it.
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
const SMTP_FROM = process.env.SMTP_FROM || "Borrowed Blues <no-reply@borrowedblues.com>";
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");

const PORT = Number(process.env.PORT || 8001);

const JWT_ALGORITHM = "HS256";
const ACCESS_TTL_SECONDS = 8 * 60 * 60; // 8 hours
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

module.exports = {
  MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE,
  JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD,
  CORS_ORIGINS, COOKIE_SECURE,
  SEED_DEMO_DATA, CLIENT_SEED_EMAIL, CLIENT_SEED_PASSWORD,
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, FRONTEND_URL,
  PORT,
  JWT_ALGORITHM, ACCESS_TTL_SECONDS, REFRESH_TTL_SECONDS,
  LOCKOUT_ATTEMPTS, LOCKOUT_DURATION_MINUTES,
};
