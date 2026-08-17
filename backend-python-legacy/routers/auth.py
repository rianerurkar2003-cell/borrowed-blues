"""Auth router: /api/auth/*"""
import uuid
import logging
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from config import FRONTEND_URL, LOCKOUT_ATTEMPTS, LOCKOUT_DURATION
from db import db
from deps import get_current_user
from mail import send_email
from models import ForgotPasswordRequest, LoginRequest, RegisterRequest, ResetPasswordRequest
from security import (clear_auth_cookies, create_access_token, create_refresh_token,
                      decode_token, hash_password, set_auth_cookies, verify_password)

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger("borrowed_blues.auth")


@router.post("/register")
async def register(payload: RegisterRequest, response: Response):
    email = payload.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    role = "client"
    await db.users.insert_one({
        "id": user_id, "email": email, "name": payload.name, "role": role,
        "password_hash": hash_password(payload.password), "created_at": now,
    })
    access = create_access_token(user_id, email, role)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    return {"id": user_id, "email": email, "name": payload.name, "role": role,
            "created_at": now, "access_token": access}


@router.post("/login")
async def login(payload: LoginRequest, request: Request, response: Response):
    email = payload.email.lower().strip()
    identifier = f"email:{email}"

    lock = await db.login_attempts.find_one({"identifier": identifier})
    if lock and lock.get("locked_until"):
        locked_until = datetime.fromisoformat(lock["locked_until"])
        if locked_until > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        attempts = (lock or {}).get("count", 0) + 1
        update = {"identifier": identifier, "count": attempts}
        if attempts >= LOCKOUT_ATTEMPTS:
            update["locked_until"] = (datetime.now(timezone.utc) + LOCKOUT_DURATION).isoformat()
        await db.login_attempts.update_one({"identifier": identifier}, {"$set": update}, upsert=True)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await db.login_attempts.delete_one({"identifier": identifier})
    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return {"id": user["id"], "email": user["email"], "name": user["name"],
            "role": user["role"], "created_at": user["created_at"], "access_token": access}


@router.post("/logout")
async def logout(response: Response, user: dict = Depends(get_current_user)):
    clear_auth_cookies(response)
    return {"ok": True}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = decode_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user = await db.users.find_one({"id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    access = create_access_token(user["id"], user["email"], user["role"])
    set_auth_cookies(response, access, token)
    return {"ok": True}


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    user = await db.users.find_one({"email": payload.email.lower().strip()})
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one({
            "token": token, "user_id": user["id"],
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
            "used": False,
        })
        link = f"{FRONTEND_URL}/reset-password?token={token}"
        try:
            send_email(
                to=user["email"],
                subject="Reset your Borrowed Blues password",
                html_body=(
                    f'<p>Hi {user.get("name", "")},</p>'
                    f'<p>Use the link below to reset your password. It expires in 1 hour.</p>'
                    f'<p><a href="{link}">{link}</a></p>'
                    f"<p>If you didn't request this, you can ignore this email.</p>"
                ),
                text_body=f"Reset your password: {link}\nThis link expires in 1 hour.",
            )
        except Exception:
            logger.exception(f"Failed to send password reset email to {user['email']}")
    # Do not leak whether the email exists.
    return {"ok": True, "message": "If that email exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    rec = await db.password_reset_tokens.find_one({"token": payload.token, "used": False})
    if not rec:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    await db.users.update_one(
        {"id": rec["user_id"]},
        {"$set": {"password_hash": hash_password(payload.new_password)}},
    )
    await db.password_reset_tokens.update_one({"token": payload.token}, {"$set": {"used": True}})
    return {"ok": True}
