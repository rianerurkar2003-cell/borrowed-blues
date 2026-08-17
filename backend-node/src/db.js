// MySQL connection pool.
"use strict";
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

module.exports = { pool };
