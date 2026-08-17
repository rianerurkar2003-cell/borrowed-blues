// MySQL (via the pool's dateStrings:true + timezone:'Z') returns DATETIME
// columns as "YYYY-MM-DD HH:MM:SS.mmm" — not valid ISO-8601, and JS Date
// parsing of that shape is implementation-defined (works in Chrome, not
// guaranteed in Safari/Firefox). Convert to a real ISO string with a 'Z'
// suffix before it ever reaches a JSON response, matching Python's
// `datetime.now(timezone.utc).isoformat()` output the frontend already expects.
"use strict";

function toIso(mysqlDatetime) {
  if (mysqlDatetime == null) return mysqlDatetime;
  return mysqlDatetime.replace(" ", "T") + "Z";
}

/** Apply toIso() to one or more fields on a row (mutates and returns it). */
function withIsoDates(row, fields = ["created_at"]) {
  if (!row) return row;
  for (const f of fields) {
    if (row[f] != null) row[f] = toIso(row[f]);
  }
  return row;
}

module.exports = { toIso, withIsoDates };
