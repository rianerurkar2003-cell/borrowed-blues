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
const { sendEmail } = require("../mail");
const config = require("../config");

const router = express.Router();

const CONTACT_LABEL = { email: "email", phone_call: "a phone call" };

async function sendTherapistNewRequestEmail(doc) {
  try {
    const contactLine = [doc.email, doc.phone].filter(Boolean).join(" · ") || "no contact details given";
    await sendEmail(
      config.ADMIN_EMAIL,
      `New consultation request: ${doc.name}`,
      `<p>${doc.name} reached out via Borrowed Blues.</p>` +
        `<p>Contact: ${contactLine}<br/>Prefers: ${CONTACT_LABEL[doc.preferred_contact] || doc.preferred_contact}, ${doc.preferred_language}</p>` +
        (doc.reason ? `<p>Note: ${doc.reason}</p>` : "") +
        `<p>See it in your Requests inbox to accept or decline.</p>`,
      `${doc.name} reached out via Borrowed Blues.\nContact: ${contactLine}\nPrefers: ${CONTACT_LABEL[doc.preferred_contact] || doc.preferred_contact}, ${doc.preferred_language}\n` +
        (doc.reason ? `Note: ${doc.reason}\n` : ""),
    );
  } catch (err) {
    console.error("[mail] new-request notification to therapist failed:", err.message);
  }
}

async function sendSubmitterConfirmationEmail(doc, replyWindowText) {
  if (!doc.email) return;
  try {
    await sendEmail(
      doc.email,
      "Your note is on its way",
      `<p>Hi ${doc.name || ""},</p>` +
        `<p>Thanks for reaching out to Borrowed Blues. Anushka reads notes personally and usually replies within ${replyWindowText}.</p>` +
        `<p>Can't see a reply? Check your spam folder.</p>`,
      `Thanks for reaching out to Borrowed Blues. Anushka reads notes personally and usually replies within ${replyWindowText}.`,
    );
  } catch (err) {
    console.error("[mail] submitter confirmation email failed:", err.message);
  }
}

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
      `INSERT INTO consultation_requests
        (id, name, email, phone, preferred_contact, preferred_language, is_adult, reason, preferred_time, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doc.id, doc.name, doc.email || null, doc.phone || null,
        doc.preferred_contact, doc.preferred_language, doc.is_adult ? 1 : 0,
        doc.reason || null, doc.preferred_time || null, doc.status, doc.created_at,
      ],
    );
    const [rows] = await pool.query("SELECT * FROM consultation_requests WHERE id = ?", [doc.id]);
    const created = { ...rows[0], is_adult: !!rows[0].is_adult };
    res.json(clean(withIsoDates(created)));

    sendTherapistNewRequestEmail(created).catch((err) =>
      console.error("[mail] unhandled new-request notification error:", err),
    );
    pool.query("SELECT reply_window_text FROM therapist_profile WHERE slug = 'primary'")
      .then(([[profile]]) => sendSubmitterConfirmationEmail(created, profile?.reply_window_text || "one to two working days"))
      .catch((err) => console.error("[mail] unhandled submitter confirmation error:", err));
  }),
);

module.exports = router;
