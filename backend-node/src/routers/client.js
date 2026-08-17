// Client router: /api/client/*
"use strict";
const express = require("express");
const { pool } = require("../db");
const { newId } = require("../lib/ids");
const { withIsoDates } = require("../lib/dates");
const { ApiError } = require("../lib/ApiError");
const asyncHandler = require("../lib/asyncHandler");
const { requireRole } = require("../authMiddleware");
const { validate } = require("../validation/validate");
const { AppointmentIn, ReflectionIn, HomeworkStatusIn } = require("../validation/schemas");

const router = express.Router();
router.use(requireRole("client"));

function toAppointment(r) {
  return withIsoDates(r);
}
function toHomework(r) {
  return withIsoDates({ ...r, completed: !!r.completed });
}
function toReflection(r) {
  return withIsoDates({ ...r, is_draft: !!r.is_draft });
}
function toSessionNote(r) {
  return withIsoDates({ ...r, shared_with_client: !!r.shared_with_client });
}
function toResource(r) {
  return withIsoDates({ ...r, is_public: !!r.is_public });
}

router.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const clientId = req.user.id;
    const today = new Date().toISOString().slice(0, 10);

    const [upcoming] = await pool.query(
      `SELECT * FROM appointments WHERE client_id = ? AND date >= ?
       AND status IN ('scheduled','requested') ORDER BY date ASC LIMIT 5`,
      [clientId, today],
    );
    const [summaryRows] = await pool.query(
      `SELECT * FROM session_notes WHERE client_id = ? AND shared_with_client = 1
       ORDER BY created_at DESC LIMIT 1`,
      [clientId],
    );
    const [homework] = await pool.query(
      `SELECT * FROM homework WHERE client_id = ? AND completed = 0
       ORDER BY created_at DESC LIMIT 10`,
      [clientId],
    );
    const [reflections] = await pool.query(
      `SELECT * FROM reflections WHERE user_id = ? AND is_draft = 0
       ORDER BY created_at DESC LIMIT 3`,
      [clientId],
    );

    res.json({
      upcoming: upcoming.map(toAppointment),
      latest_summary: summaryRows[0] ? toSessionNote(summaryRows[0]) : null,
      homework: homework.map(toHomework),
      reflections: reflections.map(toReflection),
    });
  }),
);

router.get(
  "/appointments",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      "SELECT * FROM appointments WHERE client_id = ? ORDER BY date ASC LIMIT 200",
      [req.user.id],
    );
    res.json(rows.map(toAppointment));
  }),
);

router.post(
  "/appointments/request",
  validate(AppointmentIn),
  asyncHandler(async (req, res) => {
    const [therapistRows] = await pool.query("SELECT id FROM users WHERE role = 'therapist' LIMIT 1");
    const therapist = therapistRows[0];
    if (!therapist) throw new ApiError(404, "No therapist available");

    const id = newId();
    await pool.query(
      `INSERT INTO appointments (id, client_id, therapist_id, date, time, duration_min, mode, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'requested', ?)`,
      [id, req.user.id, therapist.id, req.body.date, req.body.time, req.body.duration_min, req.body.mode, req.body.notes || null],
    );
    const [rows] = await pool.query("SELECT * FROM appointments WHERE id = ?", [id]);
    res.json(toAppointment(rows[0]));
  }),
);

router.get(
  "/reflections",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      "SELECT * FROM reflections WHERE user_id = ? ORDER BY created_at DESC LIMIT 200",
      [req.user.id],
    );
    res.json(rows.map(toReflection));
  }),
);

router.post(
  "/reflections",
  validate(ReflectionIn),
  asyncHandler(async (req, res) => {
    const doc = {
      id: newId(), user_id: req.user.id, ...req.body, created_at: new Date(),
    };
    await pool.query(
      "INSERT INTO reflections (id, user_id, title, body, mood, is_draft, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [doc.id, doc.user_id, doc.title, doc.body, doc.mood || null, doc.is_draft ? 1 : 0, doc.created_at],
    );
    const [rows] = await pool.query("SELECT * FROM reflections WHERE id = ?", [doc.id]);
    res.json(toReflection(rows[0]));
  }),
);

router.get(
  "/homework",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      "SELECT * FROM homework WHERE client_id = ? ORDER BY created_at DESC LIMIT 100",
      [req.user.id],
    );
    res.json(rows.map(toHomework));
  }),
);

router.patch(
  "/homework/:hwId",
  validate(HomeworkStatusIn),
  asyncHandler(async (req, res) => {
    const { hwId } = req.params;
    const { completed, completed_items: completedItems, client_notes: clientNotes } = req.body;
    await pool.query(
      `UPDATE homework SET completed = ?, completed_items = ?, client_notes = ?
       WHERE id = ? AND client_id = ?`,
      [
        completed ? 1 : 0,
        JSON.stringify(completedItems ?? []),
        clientNotes ?? "",
        hwId,
        req.user.id,
      ],
    );
    const [rows] = await pool.query("SELECT * FROM homework WHERE id = ?", [hwId]);
    res.json(rows[0] ? toHomework(rows[0]) : null);
  }),
);

router.get(
  "/session-notes",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      `SELECT * FROM session_notes WHERE client_id = ? AND shared_with_client = 1
       ORDER BY created_at DESC LIMIT 100`,
      [req.user.id],
    );
    res.json(rows.map(toSessionNote));
  }),
);

router.get(
  "/resources",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM resources ORDER BY created_at DESC LIMIT 200");
    res.json(rows.map(toResource));
  }),
);

router.get(
  "/resources/:resourceId",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM resources WHERE id = ?", [req.params.resourceId]);
    if (!rows[0]) throw new ApiError(404, "Resource not found");
    res.json(toResource(rows[0]));
  }),
);

module.exports = router;
