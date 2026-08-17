// Mirrors FastAPI's HTTPException: thrown from anywhere, caught by the
// central error handler in server.js and turned into {"detail": ...}.
"use strict";
class ApiError extends Error {
  constructor(statusCode, detail) {
    super(typeof detail === "string" ? detail : JSON.stringify(detail));
    this.statusCode = statusCode;
    this.detail = detail;
  }
}

module.exports = { ApiError };
