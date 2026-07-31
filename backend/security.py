"""Password hashing + JWT token helpers."""
from datetime import datetime, timezone
import bcrypt
import jwt
from fastapi import Response

from config import JWT_SECRET, JWT_ALGORITHM, ACCESS_TTL, REFRESH_TTL, COOKIE_SECURE


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id, "email": email, "role": role, "type": "access",
        "exp": datetime.now(timezone.utc) + ACCESS_TTL,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id, "type": "refresh",
        "exp": datetime.now(timezone.utc) + REFRESH_TTL,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


def set_auth_cookies(response: Response, access: str, refresh: str) -> None:
    samesite = "none" if COOKIE_SECURE else "lax"
    response.set_cookie("access_token", access, httponly=True, secure=COOKIE_SECURE,
                        samesite=samesite, max_age=int(ACCESS_TTL.total_seconds()), path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=COOKIE_SECURE,
                        samesite=samesite, max_age=int(REFRESH_TTL.total_seconds()), path="/")


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
