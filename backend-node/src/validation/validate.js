// Express middleware factory: validates req.body against a zod schema,
// replaces req.body with the parsed/defaulted result, or throws a 422
// shaped like FastAPI's RequestValidationError ({"detail": [...]}).
"use strict";
const { ApiError } = require("../lib/ApiError");

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const detail = result.error.issues.map((issue) => ({
        loc: issue.path,
        msg: issue.message,
        type: issue.code,
      }));
      throw new ApiError(422, detail);
    }
    req.body = result.data;
    next();
  };
}

module.exports = { validate };
