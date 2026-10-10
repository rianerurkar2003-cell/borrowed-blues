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
const { AppointmentIn, ReflectionIn, ReflectionVisibilityIn, HomeworkStatusIn, OnboardingIn } = require("../validation/schemas");

const router = express.Router();
router.use(requireRole("client"));

// Bump this if consent card copy ever changes meaningfully -- existing
// acknowledgements/signatures are scoped per-version, so clients would be
// asked to re-acknowledge only the version that changed (spec S2).
const CONSENT_VERSION = "v1";

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
    const [[profileRow]] = await pool.query(
      "SELECT stage1_status, stage3_status FROM client_profiles WHERE user_id = ?",
      [clientId],
    );
    const [[consentCount]] = await pool.query(
      "SELECT COUNT(DISTINCT section_key) AS n FROM consent_acknowledgements WHERE user_id = ? AND consent_version = ?",
      [clientId, CONSENT_VERSION],
    );
    const [[signatureRow]] = await pool.query(
      "SELECT id FROM consent_signatures WHERE user_id = ? AND consent_version = ? LIMIT 1",
      [clientId, CONSENT_VERSION],
    );

    res.json({
      upcoming: upcoming.map(toAppointment),
      latest_summary: summaryRows[0] ? toSessionNote(summaryRows[0]) : null,
      homework: homework.map(toHomework),
      reflections: reflections.map(toReflection),
      onboarding_status: {
        stage1: profileRow?.stage1_status || "not_started",
        stage2_done: !!signatureRow && (consentCount?.n || 0) >= 5,
        stage3: profileRow?.stage3_status || "not_started",
      },
    });
  }),
);

router.get(
  "/onboarding",
  asyncHandler(async (req, res) => {
    const clientId = req.user.id;
    await pool.query(
      `INSERT INTO client_profiles (user_id, preferred_name) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE user_id = user_id`,
      [clientId, req.user.name],
    );
    const [[profile]] = await pool.query("SELECT * FROM client_profiles WHERE user_id = ?", [clientId]);
    const [[emergencyContact]] = await pool.query("SELECT * FROM emergency_contacts WHERE user_id = ?", [clientId]);
    const [[disclosure]] = await pool.query("SELECT * FROM intake_disclosures WHERE user_id = ?", [clientId]);
    const [acks] = await pool.query(
      "SELECT section_key FROM consent_acknowledgements WHERE user_id = ? AND consent_version = ?",
      [clientId, CONSENT_VERSION],
    );
    const [[signature]] = await pool.query(
      "SELECT typed_name, signed_at FROM consent_signatures WHERE user_id = ? AND consent_version = ? ORDER BY signed_at DESC LIMIT 1",
      [clientId, CONSENT_VERSION],
    );

    res.json({
      profile: profile ? withIsoDates(profile, ["updated_at"]) : null,
      emergency_contact: emergencyContact ? withIsoDates(emergencyContact, ["updated_at"]) : null,
      disclosure: disclosure ? withIsoDates(disclosure, ["updated_at"]) : null,
      consent: {
        version: CONSENT_VERSION,
        acknowledged_sections: acks.map((a) => a.section_key),
        signature: signature ? withIsoDates(signature, ["signed_at"]) : null,
      },
    });
  }),
);

router.put(
  "/onboarding",
  validate(OnboardingIn),
  asyncHandler(async (req, res) => {
    const clientId = req.user.id;
    const b = req.body;
    // Callers send partial payloads (e.g. the structure-chooser PUTs just
    // {structure_mode}) as well as full-form payloads (Stage 1's per-field
    // autosave). A field *omitted* from the body should keep its existing
    // value, not be nulled out -- resolve that in JS per field, since
    // MySQL's VALUES() upsert trick can't distinguish "omitted" from
    // "explicitly null" once the INSERT values list is already built.
    const [[existing]] = await pool.query("SELECT * FROM client_profiles WHERE user_id = ?", [clientId]);
    const pick = (key, fallback = null) => (b[key] !== undefined ? b[key] : existing?.[key] ?? fallback);
    const fields = {
      preferred_name: pick("preferred_name"),
      pronouns: pick("pronouns"),
      gender_text: pick("gender_text"),
      age: pick("age"),
      city: pick("city"),
      timezone: pick("timezone"),
      occupation: pick("occupation"),
      structure_mode: pick("structure_mode"),
      stage1_status: pick("stage1_status", "not_started"),
    };
    await pool.query(
      `INSERT INTO client_profiles
         (user_id, preferred_name, pronouns, gender_text, age, city, timezone, occupation, structure_mode, stage1_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         preferred_name = VALUES(preferred_name), pronouns = VALUES(pronouns), gender_text = VALUES(gender_text),
         age = VALUES(age), city = VALUES(city), timezone = VALUES(timezone), occupation = VALUES(occupation),
         structure_mode = VALUES(structure_mode), stage1_status = VALUES(stage1_status)`,
      [
        clientId, fields.preferred_name, fields.pronouns, fields.gender_text, fields.age,
        fields.city, fields.timezone, fields.occupation, fields.structure_mode, fields.stage1_status,
      ],
    );
    const [[profile]] = await pool.query("SELECT * FROM client_profiles WHERE user_id = ?", [clientId]);
    res.json(withIsoDates(profile, ["updated_at"]));
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
      "INSERT INTO reflections (id, user_id, title, body, mood, is_draft, visibility, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [doc.id, doc.user_id, doc.title, doc.body, doc.mood || null, doc.is_draft ? 1 : 0, doc.visibility, doc.created_at],
    );
    const [rows] = await pool.query("SELECT * FROM reflections WHERE id = ?", [doc.id]);
    res.json(toReflection(rows[0]));
  }),
);

router.patch(
  "/reflections/:reflectionId",
  validate(ReflectionVisibilityIn),
  asyncHandler(async (req, res) => {
    const { reflectionId } = req.params;
    await pool.query(
      "UPDATE reflections SET visibility = ? WHERE id = ? AND user_id = ?",
      [req.body.visibility, reflectionId, req.user.id],
    );
    const [rows] = await pool.query("SELECT * FROM reflections WHERE id = ?", [reflectionId]);
    res.json(rows[0] ? toReflection(rows[0]) : null);
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
