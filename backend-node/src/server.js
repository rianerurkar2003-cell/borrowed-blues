// Express app entrypoint. Wires config, db, middleware, routers, seed.
"use strict";
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const config = require("./config");
const { runMigrations } = require("./db");
const { seed } = require("./seed");
const { ApiError } = require("./lib/ApiError");

const publicRouter = require("./routers/public");
const authRouter = require("./routers/auth");
const therapistRouter = require("./routers/therapist");
const clientRouter = require("./routers/client");

const app = express();

// ---------- CORS ----------
// CORS_ORIGINS="*"                              -> open (dev / preview)
// CORS_ORIGINS="https://a.com,https://b.com"    -> explicit allow-list (prod)
const corsRaw = (config.CORS_ORIGINS || "").trim();
if (corsRaw === "*" || !corsRaw) {
  app.use(cors({ origin: true, credentials: true }));
  console.log("CORS: open (reflects any origin).");
} else {
  const origins = corsRaw.split(",").map((o) => o.trim()).filter(Boolean);
  app.use(cors({ origin: origins, credentials: true }));
  console.log(`CORS: allow-list of ${origins.length} origin(s).`);
}

app.use(cookieParser());
app.use(express.json());

// ---------- Routers (all under /api) ----------
app.use("/api", publicRouter);
app.use("/api/auth", authRouter);
app.use("/api/therapist", therapistRouter);
app.use("/api/client", clientRouter);

// ---------- 404 for unmatched API routes ----------
app.use((req, res, next) => {
  next(new ApiError(404, "Not Found"));
});

// ---------- Centralised error handler ----------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ detail: err.detail });
  }
  console.error(`Unhandled server error on ${req.method} ${req.path}:`, err);
  return res.status(500).json({ detail: "Internal server error" });
});

async function start() {
  try {
    await runMigrations();
    await seed();
    console.log("Startup complete: schema ensured, seed complete.");
  } catch (err) {
    console.error("Startup failed:", err);
  }
  app.listen(config.PORT, () => {
    console.log(`Borrowed Blues API (Node) listening on port ${config.PORT}`);
  });
}

start();

module.exports = app;
