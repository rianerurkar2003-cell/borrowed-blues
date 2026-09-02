// MySQL connection pool.
"use strict";
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const config = require("./config");

const pool = mysql.createPool({
  host: config.MYSQL_HOST,
  port: config.MYSQL_PORT,
  user: config.MYSQL_USER,
  password: config.MYSQL_PASSWORD,
  database: config.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true, // return DATETIME columns as strings, not JS Date objects
  timezone: "Z", // store/read all DATETIMEs as UTC, matching the Python backend
});

// Ensures the schema exists on every boot (CREATE TABLE IF NOT EXISTS, so
// safe to re-run) — mirrors the Python backend's create_indexes(), which
// also runs unconditionally on startup. Means a fresh database never needs
// a separate manual migration step before the app can run.
async function runMigrations() {
  const migrationsDir = path.join(__dirname, "..", "migrations");
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  const conn = await mysql.createConnection({
    host: config.MYSQL_HOST,
    port: config.MYSQL_PORT,
    user: config.MYSQL_USER,
    password: config.MYSQL_PASSWORD,
    database: config.MYSQL_DATABASE,
    multipleStatements: true,
  });
  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      await conn.query(sql);
    }
  } finally {
    await conn.end();
  }
}

module.exports = { pool, runMigrations };
