// Outbound email via SMTP. No SMTP_HOST configured -> logs instead of
// sending (and resolves false), so local dev needs no setup; resolves true once sent.
"use strict";
const nodemailer = require("nodemailer");
const config = require("./config");

async function sendEmail(to, subject, htmlBody, textBody) {
  if (!config.SMTP_HOST) {
    console.log(`[mail] SMTP not configured; would send to ${JSON.stringify(to)}: ${JSON.stringify(subject)}`);
    return false;
  }

  const secure = config.SMTP_PORT === 465;
  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure,
    requireTLS: !secure,
    auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD } : undefined,
  });

  await transporter.sendMail({
    from: config.SMTP_FROM,
    to,
    subject,
    text: textBody,
    html: htmlBody,
  });
  return true;
}

const escapeHtml = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

module.exports = { sendEmail, escapeHtml };
