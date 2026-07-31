"""Runtime configuration. Fails fast on missing critical env vars."""
import os
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")


def _required(key: str) -> str:
    val = os.environ.get(key)
    if not val:
        raise RuntimeError(f"Missing required environment variable: {key}")
    return val


MONGO_URL      = _required("MONGO_URL")
DB_NAME        = _required("DB_NAME")
JWT_SECRET     = _required("JWT_SECRET")
ADMIN_EMAIL    = _required("ADMIN_EMAIL").lower()
ADMIN_PASSWORD = _required("ADMIN_PASSWORD")
CORS_ORIGINS   = os.environ.get("CORS_ORIGINS", "*")
# Auth cookies default to production-safe (Secure + SameSite=None, required for
# cross-site HTTPS deployments). Set COOKIE_SECURE=false only for local HTTP dev,
# where SameSite=Lax is used instead (browsers reject SameSite=None without Secure).
COOKIE_SECURE  = os.environ.get("COOKIE_SECURE", "true").strip().lower() != "false"
# Dev/demo fixture data (seed.py): the demo client account and its sample
# appointments/journal/homework/consultation requests. Defaults on for local
# dev. Set SEED_DEMO_DATA=false in production so a fresh deploy only creates
# the real therapist account (above) and stays otherwise empty.
SEED_DEMO_DATA = os.environ.get("SEED_DEMO_DATA", "true").strip().lower() != "false"
# Only required when SEED_DEMO_DATA is on — production with it disabled
# doesn't need to invent demo-client credentials just to boot.
CLIENT_SEED_EMAIL    = _required("CLIENT_SEED_EMAIL").lower() if SEED_DEMO_DATA else ""
CLIENT_SEED_PASSWORD = _required("CLIENT_SEED_PASSWORD") if SEED_DEMO_DATA else ""

JWT_ALGORITHM   = "HS256"
ACCESS_TTL      = timedelta(hours=8)
REFRESH_TTL     = timedelta(days=30)
LOCKOUT_ATTEMPTS = 5
LOCKOUT_DURATION = timedelta(minutes=15)
