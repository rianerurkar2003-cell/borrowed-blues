// Therapist router: /api/therapist/*
"use strict";
const crypto = require("crypto");
const express = require("express");
const { pool } = require("../db");
const { newId } = require("../lib/ids");
const { withIsoDates } = require("../lib/dates");
const { clean } = require("../lib/clean");
const { ApiError } = require("../lib/ApiError");
const asyncHandler = require("../lib/asyncHandler");
const { requireRole } = require("../authMiddleware");
const { hashPassword } = require("../security");
const { validate } = require("../validation/validate");
const { AppointmentIn, SessionSummaryIn, HomeworkIn, ResourceIn, CreateClientIn } = require("../validation/schemas");

const router = express.Router();
router.use(requireRole("therapist"));

const toAppointment = (r) => withIsoDates(r);
const toReflection = (r) => withIsoDates({ ...r, is_draft: !!r.is_draft });
const toSessionNote = (r) => withIsoDates({ ...r, shared_with_client: !!r.shared_with_client });
const toResource = (r) => withIsoDates({ ...r, is_public: !!r.is_public });
const toRequest = (r) => withIsoDates(r);
const toHomework = (r) => withIsoDates({ ...r, completed: !!r.completed });

router.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const therapistId = req.user.id;
    const today = new Date().toISOString().slice(0, 10);

    const [todays] = await pool.query(
      "SELECT * FROM appointments WHERE therapist_id = ? AND date = ? LIMIT 50",
      [therapistId, today],
    );
    const [upcoming] = await pool.query(
      `SELECT * FROM appointments WHERE therapist_id = ? AND date > ?
       AND status IN ('scheduled','requested') ORDER BY date ASC LIMIT 20`,
      [therapistId, today],
    );
    const [requests] = await pool.query(
      "SELECT * FROM consultation_requests WHERE status = 'new' ORDER BY created_at DESC LIMIT 20",
    );
    const [reflections] = await pool.query(
      "SELECT * FROM reflections WHERE is_draft = 0 ORDER BY created_at DESC LIMIT 10",
    );
    const [[{ client_count: clientCount }]] = await pool.query(
      "SELECT COUNT(*) AS client_count FROM users WHERE role = 'client'",
    );

    res.json({
      today: todays.map(toAppointment),
      upcoming: upcoming.map(toAppointment),
      requests: requests.map(toRequest),
      reflections: reflections.map(toReflection),
      client_count: clientCount,
    });
  }),
);

router.get(
  "/clients",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE role = 'client' LIMIT 500",
    );
    res.json(rows.map((r) => withIsoDates(clean(r))));
  }),
);

router.post(
  "/clients",
  validate(CreateClientIn),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase().trim();
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing[0]) throw new ApiError(400, "Email already registered");

    // No password given -> generate one, so the therapist can create an
    // account without having to invent a secure password herself. Only
    // returned in this one response since it can never be retrieved again.
    const wasGenerated = !req.body.password;
    const password = req.body.password || crypto.randomBytes(6).toString("base64url");

    const id = newId();
    await pool.query(
      "INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, 'client')",
      [id, email, hashPassword(password), req.body.name],
    );
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    const client = withIsoDates(clean(rows[0]));
    res.json(wasGenerated ? { ...client, generated_password: password } : client);
  }),
);

router.delete(
  "/clients/:clientId",
  asyncHandler(async (req, res) => {
    const { clientId } = req.params;
    const [rows] = await pool.query("SELECT id FROM users WHERE id = ? AND role = 'client'", [clientId]);
    if (!rows[0]) throw new ApiError(404, "Client not found");

    // No cascading FK on these tables, so clear them out before the user row
    // (appointments does have an FK to users, so it must go first or the
    // final DELETE fails).
    await pool.query("DELETE FROM session_notes WHERE client_id = ?", [clientId]);
    await pool.query("DELETE FROM homework WHERE client_id = ?", [clientId]);
    await pool.query("DELETE FROM reflections WHERE user_id = ?", [clientId]);
    await pool.query("DELETE FROM appointments WHERE client_id = ?", [clientId]);
    await pool.query("DELETE FROM users WHERE id = ?", [clientId]);

    res.json({ ok: true });
  }),
);

router.get(
  "/appointments",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      "SELECT * FROM appointments WHERE therapist_id = ? ORDER BY date ASC LIMIT 500",
      [req.user.id],
    );
    res.json(rows.map(toAppointment));
  }),
);

router.post(
  "/appointments",
  validate(AppointmentIn),
  asyncHandler(async (req, res) => {
    if (!req.body.client_id) throw new ApiError(400, "client_id required");
    const id = newId();
    await pool.query(
      `INSERT INTO appointments (id, client_id, therapist_id, date, time, duration_min, mode, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
      [id, req.body.client_id, req.user.id, req.body.date, req.body.time, req.body.duration_min, req.body.mode, req.body.notes || null],
    );
    const [rows] = await pool.query("SELECT * FROM appointments WHERE id = ?", [id]);
    res.json(toAppointment(rows[0]));
  }),
);

router.patch(
  "/appointments/:appointmentId",
  asyncHandler(async (req, res) => {
    const allowedFields = ["date", "time", "duration_min", "mode", "notes", "status"];
    const set = [];
    const params = [];
    for (const f of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, f)) {
        set.push(`${f} = ?`);
        params.push(req.body[f]);
      }
    }
    if (set.length) {
      params.push(req.params.appointmentId, req.user.id);
      await pool.query(
        `UPDATE appointments SET ${set.join(", ")} WHERE id = ? AND therapist_id = ?`,
        params,
      );
    }
    const [rows] = await pool.query("SELECT * FROM appointments WHERE id = ?", [req.params.appointmentId]);
    res.json(rows[0] ? toAppointment(rows[0]) : null);
  }),
);

router.get(
  "/requests",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      "SELECT * FROM consultation_requests ORDER BY created_at DESC LIMIT 200",
    );
    res.json(rows.map(toRequest));
  }),
);

router.patch(
  "/requests/:reqId",
  asyncHandler(async (req, res) => {
    const status = req.body.status || "new";
    await pool.query("UPDATE consultation_requests SET status = ? WHERE id = ?", [
      status, req.params.reqId,
    ]);
    res.json({ ok: true });
  }),
);

router.post(
  "/session-notes",
  validate(SessionSummaryIn),
  asyncHandler(async (req, res) => {
    const id = newId();
    const b = req.body;
    await pool.query(
      `INSERT INTO session_notes (id, therapist_id, client_id, appointment_id, summary, homework, resources, shared_with_client)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user.id, b.client_id, b.appointment_id || null, b.summary, b.homework || null,
        JSON.stringify(b.resources ?? []), b.shared_with_client ? 1 : 0],
    );
    const [rows] = await pool.query("SELECT * FROM session_notes WHERE id = ?", [id]);
    res.json(toSessionNote(rows[0]));
  }),
);

router.get(
  "/session-notes",
  asyncHandler(async (req, res) => {
    const { client_id: clientId } = req.query;
    let sql = "SELECT * FROM session_notes WHERE therapist_id = ?";
    const params = [req.user.id];
    if (clientId) {
      sql += " AND client_id = ?";
      params.push(clientId);
    }
    sql += " ORDER BY created_at DESC LIMIT 200";
    const [rows] = await pool.query(sql, params);
    res.json(rows.map(toSessionNote));
  }),
);

router.post(
  "/homework",
  validate(HomeworkIn),
  asyncHandler(async (req, res) => {
    const id = newId();
    const b = req.body;
    await pool.query(
      `INSERT INTO homework (id, therapist_id, client_id, title, description, type, items, due_date, completed, completed_items, client_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, '')`,
      [id, req.user.id, b.client_id, b.title, b.description, b.type,
        b.items != null ? JSON.stringify(b.items) : null, b.due_date || null, JSON.stringify([])],
    );
    const [rows] = await pool.query("SELECT * FROM homework WHERE id = ?", [id]);
    res.json(toHomework(rows[0]));
  }),
);

router.get(
  "/reflections",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      "SELECT * FROM reflections WHERE is_draft = 0 ORDER BY created_at DESC LIMIT 200",
    );
    res.json(rows.map(toReflection));
  }),
);

router.get(
  "/resources",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM resources ORDER BY created_at DESC LIMIT 200");
    res.json(rows.map(toResource));
  }),
);

router.post(
  "/resources",
  validate(ResourceIn),
  asyncHandler(async (req, res) => {
    const id = newId();
    const b = req.body;
    await pool.query(
      `INSERT INTO resources (id, title, description, category, kind, url, body, is_public, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, b.title, b.description, b.category, b.kind, b.url || null, b.body || null, b.is_public ? 1 : 0, req.user.id],
    );
    const [rows] = await pool.query("SELECT * FROM resources WHERE id = ?", [id]);
    res.json(toResource(rows[0]));
  }),
);

router.patch(
  "/resources/:resourceId",
  asyncHandler(async (req, res) => {
    const allowedFields = ["title", "description", "category", "kind", "url", "body", "is_public"];
    const set = [];
    const params = [];
    for (const f of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, f)) {
        set.push(`${f} = ?`);
        params.push(f === "is_public" ? (req.body[f] ? 1 : 0) : req.body[f]);
      }
    }
    if (set.length) {
      params.push(req.params.resourceId);
      await pool.query(`UPDATE resources SET ${set.join(", ")} WHERE id = ?`, params);
    }
    const [rows] = await pool.query("SELECT * FROM resources WHERE id = ?", [req.params.resourceId]);
    if (!rows[0]) throw new ApiError(404, "Resource not found");
    res.json(toResource(rows[0]));
  }),
);

module.exports = router;
