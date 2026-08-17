"""Outbound email via SMTP. No SMTP_HOST configured -> logs instead of
sending, so local dev needs no setup and never blocks on a missing provider.
"""
import logging
import smtplib
from email.message import EmailMessage

from config import SMTP_FROM, SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USER

logger = logging.getLogger("borrowed_blues.mail")


def send_email(to: str, subject: str, html_body: str, text_body: str) -> None:
    if not SMTP_HOST:
        logger.info(f"SMTP not configured; would send to {to!r}: {subject!r}\n{text_body}")
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM
    msg["To"] = to
    msg.set_content(text_body)
    msg.add_alternative(html_body, subtype="html")

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        if SMTP_USER:
            server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
