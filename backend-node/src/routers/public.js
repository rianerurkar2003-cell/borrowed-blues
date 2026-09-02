// Public router: things anyone can hit without auth.
"use strict";
const express = require("express");
const { pool } = require("../db");
const { newId } = require("../lib/ids");
const { clean } = require("../lib/clean");
const { withIsoDates } = require("../lib/dates");
const asyncHandler = require("../lib/asyncHandler");
const { validate } = require("../validation/validate");
const { ConsultationRequestIn } = require("../validation/schemas");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ service: "Borrowed Blues API", status: "ok" });
});

router.get(
  "/therapist/profile",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      "SELECT * FROM therapist_profile WHERE slug = 'primary' LIMIT 1",
    );
    res.json(rows[0] ? withIsoDates(rows[0], ["updated_at"]) : {});
  }),
);

router.get(
  "/resources/public",
  asyncHandler(async (req, res) => {
    const { category, q } = req.query;
    let sql = "SELECT id, title, description, category, kind, url, body, is_public, created_by, created_at FROM resources WHERE is_public = 1";
    const params = [];
    if (category && category !== "all") {
      sql += " AND category = ?";
      params.push(category);
    }
    const [rows] = await pool.query(sql, params);
    let docs = rows.map((r) => withIsoDates({ ...r, is_public: !!r.is_public }));
    if (q) {
      const needle = String(q).toLowerCase();
      docs = docs.filter(
        (d) =>
          (d.title || "").toLowerCase().includes(needle) ||
          (d.description || "").toLowerCase().includes(needle),
      );
    }
    res.json(docs);
  }),
);

router.post(
  "/consultation-requests",
  validate(ConsultationRequestIn),
  asyncHandler(async (req, res) => {
    const payload = req.body;
    const doc = {
      id: newId(),
      ...payload,
      status: "new",
      created_at: new Date(),
    };
    await pool.query(
      "INSERT INTO consultation_requests (id, name, email, phone, reason, preferred_time, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [doc.id, doc.name, doc.email, doc.phone || null, doc.reason || null, doc.preferred_time || null, doc.status, doc.created_at],
    );
    const [rows] = await pool.query("SELECT * FROM consultation_requests WHERE id = ?", [doc.id]);
    res.json(clean(withIsoDates(rows[0])));
  }),
);

module.exports = router;
