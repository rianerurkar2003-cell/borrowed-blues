// Express 4 doesn't catch rejected promises from async route handlers —
// wrap every handler so thrown/rejected errors reach the error middleware
// instead of hanging the request.
"use strict";
module.exports = function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
};
