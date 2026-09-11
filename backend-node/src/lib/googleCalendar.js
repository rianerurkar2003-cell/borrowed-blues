// Thin Google OAuth2 + Calendar v3 REST client, built on Node's native
// fetch (no `googleapis` dependency needed for this small a surface area).
// Pure external-service wrapper, no DB access — mirrors mail.js's role.
"use strict";
const crypto = require("crypto");
const config = require("../config");

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const CALENDAR_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const SCOPE = "https://www.googleapis.com/auth/calendar.events";

class GoogleAuthExpiredError extends Error {}
class GoogleEventGoneError extends Error {}

function isConfigured() {
  return !!(config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET && config.GOOGLE_REDIRECT_URI);
}

function getAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: config.GOOGLE_CLIENT_ID,
    redirect_uri: config.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    // Always show consent, even on a re-connect — otherwise Google omits
    // refresh_token on a second grant to an already-authorized app.
    prompt: "consent",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

async function fetchJson(url, options) {
  const res = await fetch(url, { ...options, signal: AbortSignal.timeout(10000) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(body.error_description || body.error?.message || `Google API error ${res.status}`);
    error.status = res.status;
    error.body = body;
    throw error;
  }
  return body;
}

async function exchangeCode(code) {
  return fetchJson(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.GOOGLE_CLIENT_ID,
      client_secret: config.GOOGLE_CLIENT_SECRET,
      redirect_uri: config.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
}

async function getUserEmail(accessToken) {
  const info = await fetchJson("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return info.email || null;
}

async function refreshAccessTokenRaw(refreshToken) {
  try {
    return await fetchJson(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: config.GOOGLE_CLIENT_ID,
        client_secret: config.GOOGLE_CLIENT_SECRET,
        grant_type: "refresh_token",
      }),
    });
  } catch (err) {
    if (err.body?.error === "invalid_grant") {
      throw new GoogleAuthExpiredError("Google Calendar connection expired — reconnect required.");
    }
    throw err;
  }
}

// Memoizes concurrent refreshes per user so simultaneous appointment writes
// don't fire duplicate refresh calls (mirrors the frontend's http.ts pattern).
const refreshInFlight = new Map();
function refreshAccessToken(userId, refreshToken) {
  if (refreshInFlight.has(userId)) return refreshInFlight.get(userId);
  const promise = refreshAccessTokenRaw(refreshToken).finally(() => refreshInFlight.delete(userId));
  refreshInFlight.set(userId, promise);
  return promise;
}

async function revokeToken(token) {
  try {
    await fetch(REVOKE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    console.error("[googleCalendar] revoke failed (ignoring):", err.message);
  }
}

// Google converts wall-clock time + an IANA zone itself, so date/time
// strings (which carry no offset info in our DB) can be passed as-is.
function buildEventTimes(date, time, durationMin, timeZone) {
  const start = `${date}T${time}:00`;
  const startMs = new Date(`${date}T${time}:00Z`).getTime(); // scratch arithmetic only, never emitted as UTC
  const endDate = new Date(startMs + durationMin * 60000);
  const end = endDate.toISOString().slice(0, 19);
  return {
    start: { dateTime: start, timeZone },
    end: { dateTime: end, timeZone },
  };
}

function eventBody(appointment) {
  return {
    summary: "Client session",
    ...buildEventTimes(appointment.date, appointment.time, appointment.duration_min, config.GOOGLE_CALENDAR_TIMEZONE),
  };
}

async function callCalendarApi(url, options, accessToken) {
  const res = await fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10000),
  });
  if (res.status === 404 || res.status === 410) {
    throw new GoogleEventGoneError("Google event no longer exists.");
  }
  if (res.status === 401) {
    throw new GoogleAuthExpiredError("Google Calendar connection expired — reconnect required.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || `Google Calendar API error ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

async function createEvent(accessToken, appointment) {
  const event = await callCalendarApi(CALENDAR_EVENTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventBody(appointment)),
  }, accessToken);
  return event.id;
}

async function updateEvent(accessToken, googleEventId, appointment) {
  await callCalendarApi(`${CALENDAR_EVENTS_URL}/${googleEventId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventBody(appointment)),
  }, accessToken);
}

async function deleteEvent(accessToken, googleEventId) {
  await callCalendarApi(`${CALENDAR_EVENTS_URL}/${googleEventId}`, { method: "DELETE" }, accessToken);
}

// --- Token-at-rest encryption (AES-256-GCM), optional -----------------
const ALGO = "aes-256-gcm";
function encryptToken(plain) {
  if (!config.GOOGLE_TOKEN_ENCRYPTION_KEY) return plain;
  const key = crypto.createHash("sha256").update(config.GOOGLE_TOKEN_ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${Buffer.concat([iv, tag, encrypted]).toString("base64")}`;
}
function decryptToken(stored) {
  if (!stored.startsWith("enc:")) return stored;
  if (!config.GOOGLE_TOKEN_ENCRYPTION_KEY) {
    throw new Error("Stored Google token is encrypted but GOOGLE_TOKEN_ENCRYPTION_KEY is not set.");
  }
  const key = crypto.createHash("sha256").update(config.GOOGLE_TOKEN_ENCRYPTION_KEY).digest();
  const raw = Buffer.from(stored.slice(4), "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

module.exports = {
  GoogleAuthExpiredError, GoogleEventGoneError,
  isConfigured, getAuthUrl, exchangeCode, getUserEmail,
  refreshAccessToken, revokeToken,
  createEvent, updateEvent, deleteEvent,
  encryptToken, decryptToken,
};
