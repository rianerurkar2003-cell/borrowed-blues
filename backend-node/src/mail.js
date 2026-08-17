// Outbound email via SMTP. No SMTP_HOST configured -> logs instead of
// sending, so local dev needs no setup and never blocks on a missing provider.
"use strict";
const nodemailer = require("nodemailer");
const config = require("./config");

async function sendEmail(to, subject, htmlBody, textBody) {
  if (!config.SMTP_HOST) {
    console.log(`[mail] SMTP not configured; would send to ${JSON.stringify(to)}: ${JSON.stringify(subject)}\n${textBody}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: false,
    requireTLS: true,
    auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD } : undefined,
  });

  await transporter.sendMail({
    from: config.SMTP_FROM,
    to,
    subject,
    text: textBody,
    html: htmlBody,
  });
}

module.exports = { sendEmail };
