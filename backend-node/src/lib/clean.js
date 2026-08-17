// Strip internal fields (password hash) before a row goes out over the API.
"use strict";
function clean(row) {
  if (!row) return row;
  const { password_hash, ...rest } = row;
  return rest;
}

module.exports = { clean };
