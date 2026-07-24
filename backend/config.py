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
CLIENT_SEED_EMAIL    = _required("CLIENT_SEED_EMAIL").lower()
CLIENT_SEED_PASSWORD = _required("CLIENT_SEED_PASSWORD")
CORS_ORIGINS   = os.environ.get("CORS_ORIGINS", "*")

JWT_ALGORITHM   = "HS256"
ACCESS_TTL      = timedelta(hours=8)
REFRESH_TTL     = timedelta(days=30)
LOCKOUT_ATTEMPTS = 5
LOCKOUT_DURATION = timedelta(minutes=15)
