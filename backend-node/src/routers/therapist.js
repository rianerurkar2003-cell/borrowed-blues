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
const google = require("../lib/googleCalendar");
const { sendEmail, escapeHtml } = require("../mail");
const config = require("../config");

const router = express.Router();
router.use(requireRole("therapist"));

// --- Google Calendar sync (fire-and-forget; never blocks the appointment
// response, and every function below catches its own errors internally) ---

async function getGoogleAccessToken(userId) {
  const [rows] = await pool.query("SELECT * FROM google_calendar_connections WHERE user_id = ?", [userId]);
  const conn = rows[0];
  if (!conn) return null;
  if (new Date(conn.expires_at).getTime() - Date.now() > 60000) {
    return google.decryptToken(conn.access_token);
  }
  try {
    const tokens = await google.refreshAccessToken(userId, google.decryptToken(conn.refresh_token));
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    await pool.query(
      "UPDATE google_calendar_connections SET access_token = ?, expires_at = ? WHERE user_id = ?",
      [google.encryptToken(tokens.access_token), expiresAt, userId],
    );
    return tokens.access_token;
  } catch (err) {
    if (err instanceof google.GoogleAuthExpiredError) {
      await pool.query("DELETE FROM google_calendar_connections WHERE user_id = ?", [userId]);
      return null;
    }
    throw err;
  }
}

async function syncAppointmentCreate(appointment) {
  try {
    const accessToken = await getGoogleAccessToken(appointment.therapist_id);
    if (!accessToken) return null;
    const { eventId, meetLink } = await google.createEvent(accessToken, appointment);
    await pool.query(
      `INSERT INTO google_calendar_events (appointment_id, google_event_id) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE google_event_id = VALUES(google_event_id)`,
      [appointment.id, eventId],
    );
    return meetLink;
  } catch (err) {
    console.error("[google] create event failed:", err.message);
    return null;
  }
}

async function syncAppointmentUpdate(appointment) {
  try {
    const accessToken = await getGoogleAccessToken(appointment.therapist_id);
    if (!accessToken) return;
    const [rows] = await pool.query(
      "SELECT google_event_id FROM google_calendar_events WHERE appointment_id = ?",
      [appointment.id],
    );
    if (!rows[0]) return syncAppointmentCreate(appointment);
    try {
      await google.updateEvent(accessToken, rows[0].google_event_id, appointment);
    } catch (err) {
      // Therapist deleted the event by hand in Google Calendar -> treat as
      // gone, drop the stale mapping, and recreate it fresh.
      if (err instanceof google.GoogleEventGoneError) {
        await pool.query("DELETE FROM google_calendar_events WHERE appointment_id = ?", [appointment.id]);
        return syncAppointmentCreate(appointment);
      }
      throw err;
    }
  } catch (err) {
    console.error("[google] update event failed:", err.message);
  }
}

async function syncAppointmentDelete(appointmentId, therapistId) {
  try {
    const [rows] = await pool.query(
      "SELECT google_event_id FROM google_calendar_events WHERE appointment_id = ?",
      [appointmentId],
    );
    if (!rows[0]) return;
    const accessToken = await getGoogleAccessToken(therapistId);
    if (accessToken) {
      try {
        await google.deleteEvent(accessToken, rows[0].google_event_id);
      } catch (err) {
        if (!(err instanceof google.GoogleEventGoneError)) throw err;
      }
    }
    await pool.query("DELETE FROM google_calendar_events WHERE appointment_id = ?", [appointmentId]);
  } catch (err) {
    console.error("[google] delete event failed:", err.message);
  }
}

function formatAppointmentWhen(date, time) {
  const [year, month, day] = date.split("-").map(Number);
  const dateStr = new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  return `${dateStr} at ${time.slice(0, 5)}`;
}

async function sendAppointmentConfirmationEmail(appointment, therapistName, meetLink) {
  try {
    const [rows] = await pool.query("SELECT email, name FROM users WHERE id = ?", [appointment.client_id]);
    const client = rows[0];
    if (!client || !client.email) return;
    const when = formatAppointmentWhen(appointment.date, appointment.time);
    const modeLabel = appointment.mode === "in-person" ? "in person" : "online";
    await sendEmail(
      client.email,
      "Your appointment is confirmed",
      `<p>Hi ${client.name || ""},</p>` +
        `<p>Your appointment with ${therapistName} is confirmed for <strong>${when}</strong> (${appointment.duration_min} min, ${modeLabel}).</p>` +
        (meetLink ? `<p>Join here: <a href="${meetLink}">${meetLink}</a></p>` : "") +
        `<p>If you need to reschedule, just get in touch.</p>`,
      `Your appointment with ${therapistName} is confirmed for ${when} (${appointment.duration_min} min, ${modeLabel}).\n` +
        (meetLink ? `Join here: ${meetLink}\n` : ""),
    );
  } catch (err) {
    console.error("[mail] appointment confirmation email failed:", err.message);
  }
}

// TODO(confirm): Anushka to approve this welcome email's wording, and update the
// onboarding paragraph as Stage 2 (consent) and Stage 3 ship.
async function sendConsultationAcceptedEmail({ request, email, password, therapistName }) {
  const first = (request.name || "").trim().split(/\s+/)[0] || "there";
  const therapistFirst = (therapistName || "Anushka").split(" ")[0];
  const loginUrl = `${config.FRONTEND_URL}/login`;
  const timeLine = request.preferred_time
    ? `You mentioned ${request.preferred_time} might suit you. I'll confirm a time with you shortly.`
    : "I'll be in touch shortly to find a time that suits you.";
  const credsText = password
    ? `Your private space on the Borrowed Blues website is ready.\n\nSign in: ${loginUrl}\nEmail: ${email}\nTemporary password: ${password}\n\nYou can choose your own password any time with "Forgot password?" on the sign-in page.`
    : `You already have a Borrowed Blues account with this email, so you can sign in as usual: ${loginUrl}`;
  const onboardingText =
    "Before our first session, when you're ready: once you've signed in, you'll find a card called \"Before your first session\". " +
    "It holds a few gentle questions about you and how you'd like us to work together. " +
    "Take it at your own pace. Nothing is required all at once, and anything you'd rather talk about in session can simply be skipped.";

  const text = [
    `Hi ${first},`,
    `Thank you for reaching out. I'd be glad to speak with you, and your request for a consultation call has been accepted. ${timeLine}`,
    credsText,
    onboardingText,
    `Warmly,\n${therapistFirst}`,
  ].join("\n\n");

  const credsHtml = password
    ? `<p>Your private space on the Borrowed Blues website is ready.</p>` +
      `<table style="border-collapse:collapse"><tr><td style="padding:2px 12px 2px 0;color:#555">Sign in</td><td><a href="${escapeHtml(loginUrl)}">${escapeHtml(loginUrl)}</a></td></tr>` +
      `<tr><td style="padding:2px 12px 2px 0;color:#555">Email</td><td>${escapeHtml(email)}</td></tr>` +
      `<tr><td style="padding:2px 12px 2px 0;color:#555">Temporary password</td><td><code>${escapeHtml(password)}</code></td></tr></table>` +
      `<p>You can choose your own password any time with &ldquo;Forgot password?&rdquo; on the sign-in page.</p>`
    : `<p>You already have a Borrowed Blues account with this email, so you can <a href="${escapeHtml(loginUrl)}">sign in as usual</a>.</p>`;
  const html =
    `<p>Hi ${escapeHtml(first)},</p>` +
    `<p>Thank you for reaching out. I'd be glad to speak with you, and your request for a consultation call has been accepted. ${escapeHtml(timeLine)}</p>` +
    credsHtml +
    `<p><strong>Before our first session, when you're ready:</strong> once you've signed in, you'll find a card called &ldquo;Before your first session&rdquo;. ` +
    `It holds a few gentle questions about you and how you'd like us to work together. Take it at your own pace. ` +
    `Nothing is required all at once, and anything you'd rather talk about in session can simply be skipped.</p>` +
    `<p>Warmly,<br/>${escapeHtml(therapistFirst)}</p>`;

  return sendEmail(email, `Your consultation call with ${therapistFirst}`, html, text);
}

// Creates the client's portal account (when it's safe to) and emails them.
// Never throws on mail trouble: the therapist gets the credentials back in the
// response instead, so an SMTP hiccup can't strand a newly created account.
async function onboardAcceptedRequest(request, therapist) {
  if (!request.is_adult) return { account: "skipped_under_18" };
  if (!request.email) return { account: "skipped_no_email" };

  const email = request.email.toLowerCase().trim();
  const [existing] = await pool.query("SELECT id, role FROM users WHERE email = ?", [email]);
  const existingUser = existing[0];
  if (existingUser && existingUser.role !== "client") return { account: "skipped_email_in_use" };

  const password = existingUser ? null : crypto.randomBytes(6).toString("base64url");
  if (!existingUser) {
    await pool.query(
      "INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, 'client')",
      [newId(), email, hashPassword(password), request.name],
    );
  }

  let emailSent = false;
  try {
    emailSent = await sendConsultationAcceptedEmail({ request, email, password, therapistName: therapist.name });
  } catch (err) {
    console.error("[mail] consultation accepted email failed:", err.message);
  }
  return {
    account: existingUser ? "existing" : "created",
    email_sent: emailSent,
    ...(password && !emailSent ? { generated_password: password, email } : {}),
  };
}

const toAppointment = (r) => withIsoDates(r);
const toReflection = (r) => withIsoDates({ ...r, is_draft: !!r.is_draft });
const toSessionNote = (r) => withIsoDates({ ...r, shared_with_client: !!r.shared_with_client });
const toResource = (r) => withIsoDates({ ...r, is_public: !!r.is_public });
const toRequest = (r) => withIsoDates({ ...r, is_adult: !!r.is_adult });
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
      "SELECT * FROM reflections WHERE is_draft = 0 AND visibility = 'shared' ORDER BY created_at DESC LIMIT 10",
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
    // final DELETE fails). client_profiles/emergency_contacts/intake_disclosures
    // etc. (migration 005) have the same FK-with-no-cascade shape -- added here
    // when they were introduced, same reasoning.
    await pool.query("DELETE FROM session_notes WHERE client_id = ?", [clientId]);
    await pool.query("DELETE FROM homework WHERE client_id = ?", [clientId]);
    await pool.query("DELETE FROM reflections WHERE user_id = ?", [clientId]);
    await pool.query("DELETE FROM appointments WHERE client_id = ?", [clientId]);
    await pool.query("DELETE FROM consent_acknowledgements WHERE user_id = ?", [clientId]);
    await pool.query("DELETE FROM consent_signatures WHERE user_id = ?", [clientId]);
    await pool.query("DELETE FROM emergency_contacts WHERE user_id = ?", [clientId]);
    await pool.query("DELETE FROM intake_disclosures WHERE user_id = ?", [clientId]);
    await pool.query("DELETE FROM client_profiles WHERE user_id = ?", [clientId]);
    await pool.query("DELETE FROM users WHERE id = ?", [clientId]);

    res.json({ ok: true });
  }),
);

router.get(
  "/clients/:clientId/intake",
  asyncHandler(async (req, res) => {
    const { clientId } = req.params;
    const [[client]] = await pool.query("SELECT id FROM users WHERE id = ? AND role = 'client'", [clientId]);
    if (!client) throw new ApiError(404, "Client not found");

    const [[profile]] = await pool.query("SELECT * FROM client_profiles WHERE user_id = ?", [clientId]);
    const [[emergencyContact]] = await pool.query("SELECT * FROM emergency_contacts WHERE user_id = ?", [clientId]);
    const [[disclosure]] = await pool.query("SELECT * FROM intake_disclosures WHERE user_id = ?", [clientId]);
    const [[signature]] = await pool.query(
      "SELECT typed_name, consent_version, signed_at FROM consent_signatures WHERE user_id = ? ORDER BY signed_at DESC LIMIT 1",
      [clientId],
    );

    // Stage 3 ("what brings you here") UI doesn't exist yet -- disclosure
    // rows won't exist until then, so this always resolves to the gentle
    // default for now. Never a raw blank, per spec.
    const disclosureLabel = (!disclosure || !disclosure.mode || disclosure.mode === "in_session")
      ? "Prefers to share in session"
      : null;

    res.json({
      profile: profile ? withIsoDates(profile, ["updated_at"]) : null,
      emergency_contact: emergencyContact ? withIsoDates(emergencyContact, ["updated_at"]) : null,
      disclosure: disclosure ? withIsoDates(disclosure, ["updated_at"]) : null,
      disclosure_label: disclosureLabel,
      consent_signature: signature ? withIsoDates(signature, ["signed_at"]) : null,
    });
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
    // Calendar sync runs first so an online appointment's email can include
    // the Google Meet link minted for its event.
    syncAppointmentCreate(rows[0])
      .catch((err) => {
        console.error("[google] unhandled create error:", err);
        return null;
      })
      .then((meetLink) => sendAppointmentConfirmationEmail(rows[0], req.user.name, meetLink))
      .catch((err) => console.error("[mail] unhandled confirmation email error:", err));
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
    const appt = rows[0];
    res.json(appt ? toAppointment(appt) : null);
    if (appt) {
      if (appt.status === "cancelled") {
        syncAppointmentDelete(appt.id, appt.therapist_id).catch((err) => console.error("[google] unhandled delete error:", err));
      } else if (appt.status !== "completed") {
        syncAppointmentUpdate(appt).catch((err) => console.error("[google] unhandled update error:", err));
      }
    }
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
    const [[request]] = await pool.query("SELECT * FROM consultation_requests WHERE id = ?", [req.params.reqId]);
    if (!request) throw new ApiError(404, "Request not found");

    const result = { ok: true };
    if (status === "accepted" && request.status !== "accepted") {
      Object.assign(result, await onboardAcceptedRequest(request, req.user));
    }
    await pool.query("UPDATE consultation_requests SET status = ? WHERE id = ?", [status, request.id]);
    res.json(result);
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
    const { client_id: clientId } = req.query;
    if (!clientId) throw new ApiError(400, "client_id required");
    const [[client]] = await pool.query("SELECT id FROM users WHERE id = ? AND role = 'client'", [clientId]);
    if (!client) throw new ApiError(404, "Client not found");
    const [rows] = await pool.query(
      "SELECT * FROM reflections WHERE user_id = ? AND visibility = 'shared' AND is_draft = 0 ORDER BY created_at DESC LIMIT 200",
      [clientId],
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
