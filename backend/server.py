from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
import secrets
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, status
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# ---------- Setup ----------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Borrowed Blues API")
api = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"
ACCESS_TTL = timedelta(hours=8)
REFRESH_TTL = timedelta(days=30)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("borrowed_blues")


# ---------- Auth helpers ----------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "type": "access",
        "exp": datetime.now(timezone.utc) + ACCESS_TTL,
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + REFRESH_TTL,
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access: str, refresh: str) -> None:
    response.set_cookie("access_token", access, httponly=True, secure=True,
                        samesite="none", max_age=int(ACCESS_TTL.total_seconds()), path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True,
                        samesite="none", max_age=int(REFRESH_TTL.total_seconds()), path="/")


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_role(*roles: str):
    async def _guard(user: dict = Depends(get_current_user)):
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return _guard


# ---------- Models ----------
class UserOut(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: Literal["therapist", "client"]
    created_at: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember: Optional[bool] = False


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Literal["therapist", "client"] = "client"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class AppointmentIn(BaseModel):
    client_id: Optional[str] = None
    date: str  # ISO date string
    time: str  # e.g. "10:00"
    duration_min: int = 50
    mode: Literal["online", "in-person"] = "online"
    notes: Optional[str] = None


class Appointment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    therapist_id: str
    date: str
    time: str
    duration_min: int = 50
    mode: str = "online"
    status: Literal["scheduled", "completed", "cancelled", "requested"] = "scheduled"
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ConsultationRequestIn(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    reason: Optional[str] = None
    preferred_time: Optional[str] = None


class SessionSummaryIn(BaseModel):
    appointment_id: Optional[str] = None
    client_id: str
    summary: str
    homework: Optional[str] = None
    resources: Optional[List[str]] = None
    shared_with_client: bool = True


class ReflectionIn(BaseModel):
    title: str
    body: str
    mood: Optional[str] = None
    is_draft: bool = False


class HomeworkIn(BaseModel):
    client_id: str
    title: str
    description: str
    type: Literal["checklist", "writing", "breathing", "reading"] = "writing"
    items: Optional[List[str]] = None  # for checklist
    due_date: Optional[str] = None


class HomeworkStatusIn(BaseModel):
    completed: bool
    completed_items: Optional[List[int]] = None
    client_notes: Optional[str] = None


class ResourceIn(BaseModel):
    title: str
    description: str
    category: str
    kind: Literal["article", "pdf", "video", "link"] = "article"
    url: Optional[str] = None
    body: Optional[str] = None
    is_public: bool = True


# ---------- Serialization helpers ----------
def clean(doc: dict) -> dict:
    if not doc:
        return doc
    doc.pop("_id", None)
    doc.pop("password_hash", None)
    return doc


# ---------- Auth endpoints ----------
@api.post("/auth/register")
async def register(payload: RegisterRequest, response: Response):
    email = payload.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "email": email,
        "name": payload.name,
        "role": payload.role,
        "password_hash": hash_password(payload.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    access = create_access_token(user_id, email, payload.role)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    return {
        "id": user_id, "email": email, "name": payload.name,
        "role": payload.role, "created_at": doc["created_at"],
        "access_token": access,
    }


@api.post("/auth/login")
async def login(payload: LoginRequest, request: Request, response: Response):
    email = payload.email.lower().strip()
    # Honour X-Forwarded-For behind ingress/load-balancer; take first IP.
    xff = request.headers.get("x-forwarded-for", "")
    ip = xff.split(",")[0].strip() if xff else (request.client.host if request.client else "unknown")
    # Key primarily on email so distributed proxies can't shard the counter.
    identifier = f"email:{email}"

    # brute force check
    lock = await db.login_attempts.find_one({"identifier": identifier})
    if lock and lock.get("locked_until"):
        locked_until = datetime.fromisoformat(lock["locked_until"])
        if locked_until > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        attempts = (lock or {}).get("count", 0) + 1
        update = {"identifier": identifier, "count": attempts}
        if attempts >= 5:
            update["locked_until"] = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
        await db.login_attempts.update_one(
            {"identifier": identifier}, {"$set": update}, upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # clear attempts
    await db.login_attempts.delete_one({"identifier": identifier})

    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return {
        "id": user["id"], "email": user["email"], "name": user["name"],
        "role": user["role"], "created_at": user["created_at"],
        "access_token": access,
    }


@api.post("/auth/logout")
async def logout(response: Response, user: dict = Depends(get_current_user)):
    clear_auth_cookies(response)
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@api.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access = create_access_token(user["id"], user["email"], user["role"])
        set_auth_cookies(response, access, token)
        return {"ok": True}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@api.post("/auth/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    user = await db.users.find_one({"email": payload.email.lower().strip()})
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one({
            "token": token,
            "user_id": user["id"],
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)),
            "used": False,
        })
        logger.info(f"Password reset link: /reset-password?token={token}")
    return {"ok": True, "message": "If that email exists, a reset link has been sent."}


@api.post("/auth/reset-password")
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


# ---------- Public endpoints ----------
@api.get("/")
async def root():
    return {"service": "Borrowed Blues API", "status": "ok"}


@api.get("/therapist/profile")
async def public_therapist_profile():
    # public therapist profile
    doc = await db.therapist_profile.find_one({"slug": "primary"}) or {}
    return clean(doc) or {}


@api.get("/resources/public")
async def public_resources(category: Optional[str] = None, q: Optional[str] = None):
    query = {"is_public": True}
    if category and category != "all":
        query["category"] = category
    docs = await db.resources.find(query, {"_id": 0}).to_list(200)
    if q:
        needle = q.lower()
        docs = [d for d in docs if needle in d.get("title", "").lower()
                or needle in d.get("description", "").lower()]
    return docs


@api.post("/consultation-requests")
async def create_consultation(payload: ConsultationRequestIn):
    doc = {
        "id": str(uuid.uuid4()),
        **payload.model_dump(),
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.consultation_requests.insert_one(doc)
    return clean(doc)


# ---------- Therapist endpoints ----------
@api.get("/therapist/dashboard")
async def therapist_dashboard(user: dict = Depends(require_role("therapist"))):
    today = datetime.now(timezone.utc).date().isoformat()
    todays = await db.appointments.find(
        {"therapist_id": user["id"], "date": today}, {"_id": 0}
    ).to_list(50)
    upcoming = await db.appointments.find(
        {"therapist_id": user["id"], "date": {"$gt": today},
         "status": {"$in": ["scheduled", "requested"]}}, {"_id": 0}
    ).sort("date", 1).to_list(20)
    requests = await db.consultation_requests.find(
        {"status": "new"}, {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    reflections = await db.reflections.find(
        {"is_draft": False}, {"_id": 0}
    ).sort("created_at", -1).to_list(10)
    clients = await db.users.find(
        {"role": "client"}, {"_id": 0, "password_hash": 0}
    ).to_list(100)
    return {
        "today": todays,
        "upcoming": upcoming,
        "requests": requests,
        "reflections": reflections,
        "client_count": len(clients),
    }


@api.get("/therapist/clients")
async def list_clients(user: dict = Depends(require_role("therapist"))):
    clients = await db.users.find(
        {"role": "client"}, {"_id": 0, "password_hash": 0}
    ).to_list(500)
    return clients


@api.get("/therapist/appointments")
async def therapist_appointments(user: dict = Depends(require_role("therapist"))):
    docs = await db.appointments.find(
        {"therapist_id": user["id"]}, {"_id": 0}
    ).sort("date", 1).to_list(500)
    return docs


@api.post("/therapist/appointments")
async def create_appointment(payload: AppointmentIn,
                             user: dict = Depends(require_role("therapist"))):
    if not payload.client_id:
        raise HTTPException(status_code=400, detail="client_id required")
    doc = Appointment(
        client_id=payload.client_id,
        therapist_id=user["id"],
        date=payload.date, time=payload.time,
        duration_min=payload.duration_min, mode=payload.mode,
        notes=payload.notes,
    ).model_dump()
    await db.appointments.insert_one(doc)
    return clean(doc)


@api.patch("/therapist/appointments/{appointment_id}")
async def update_appointment(appointment_id: str, patch: dict,
                             user: dict = Depends(require_role("therapist"))):
    allowed = {k: v for k, v in patch.items() if k in
               {"date", "time", "duration_min", "mode", "notes", "status"}}
    await db.appointments.update_one(
        {"id": appointment_id, "therapist_id": user["id"]}, {"$set": allowed}
    )
    doc = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    return doc


@api.get("/therapist/requests")
async def list_requests(user: dict = Depends(require_role("therapist"))):
    docs = await db.consultation_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs


@api.patch("/therapist/requests/{req_id}")
async def update_request(req_id: str, patch: dict,
                         user: dict = Depends(require_role("therapist"))):
    await db.consultation_requests.update_one(
        {"id": req_id}, {"$set": {"status": patch.get("status", "new")}}
    )
    return {"ok": True}


@api.post("/therapist/session-notes")
async def create_note(payload: SessionSummaryIn,
                      user: dict = Depends(require_role("therapist"))):
    doc = {
        "id": str(uuid.uuid4()),
        "therapist_id": user["id"],
        **payload.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.session_notes.insert_one(doc)
    return clean(doc)


@api.get("/therapist/session-notes")
async def list_notes(client_id: Optional[str] = None,
                     user: dict = Depends(require_role("therapist"))):
    q = {"therapist_id": user["id"]}
    if client_id:
        q["client_id"] = client_id
    docs = await db.session_notes.find(q, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs


@api.post("/therapist/homework")
async def assign_homework(payload: HomeworkIn,
                          user: dict = Depends(require_role("therapist"))):
    doc = {
        "id": str(uuid.uuid4()),
        "therapist_id": user["id"],
        **payload.model_dump(),
        "completed": False,
        "completed_items": [],
        "client_notes": "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.homework.insert_one(doc)
    return clean(doc)


@api.get("/therapist/reflections")
async def all_reflections(user: dict = Depends(require_role("therapist"))):
    docs = await db.reflections.find({"is_draft": False}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs


@api.post("/therapist/resources")
async def create_resource(payload: ResourceIn,
                          user: dict = Depends(require_role("therapist"))):
    doc = {
        "id": str(uuid.uuid4()),
        **payload.model_dump(),
        "created_by": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.resources.insert_one(doc)
    return clean(doc)


# ---------- Client endpoints ----------
@api.get("/client/dashboard")
async def client_dashboard(user: dict = Depends(require_role("client"))):
    today = datetime.now(timezone.utc).date().isoformat()
    upcoming = await db.appointments.find(
        {"client_id": user["id"], "date": {"$gte": today},
         "status": {"$in": ["scheduled", "requested"]}}, {"_id": 0}
    ).sort("date", 1).limit(5).to_list(5)
    latest_summary = await db.session_notes.find_one(
        {"client_id": user["id"], "shared_with_client": True},
        {"_id": 0}, sort=[("created_at", -1)]
    )
    homework = await db.homework.find(
        {"client_id": user["id"], "completed": False}, {"_id": 0}
    ).sort("created_at", -1).to_list(10)
    reflections = await db.reflections.find(
        {"user_id": user["id"], "is_draft": False}, {"_id": 0}
    ).sort("created_at", -1).limit(3).to_list(3)
    return {
        "upcoming": upcoming,
        "latest_summary": latest_summary,
        "homework": homework,
        "reflections": reflections,
    }


@api.get("/client/appointments")
async def client_appointments(user: dict = Depends(require_role("client"))):
    docs = await db.appointments.find(
        {"client_id": user["id"]}, {"_id": 0}
    ).sort("date", 1).to_list(200)
    return docs


@api.post("/client/appointments/request")
async def request_appointment(payload: AppointmentIn,
                              user: dict = Depends(require_role("client"))):
    therapist = await db.users.find_one({"role": "therapist"})
    if not therapist:
        raise HTTPException(status_code=404, detail="No therapist available")
    doc = Appointment(
        client_id=user["id"], therapist_id=therapist["id"],
        date=payload.date, time=payload.time,
        duration_min=payload.duration_min, mode=payload.mode,
        notes=payload.notes, status="requested",
    ).model_dump()
    await db.appointments.insert_one(doc)
    return clean(doc)


@api.get("/client/reflections")
async def list_reflections(user: dict = Depends(require_role("client"))):
    docs = await db.reflections.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs


@api.post("/client/reflections")
async def create_reflection(payload: ReflectionIn,
                            user: dict = Depends(require_role("client"))):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        **payload.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.reflections.insert_one(doc)
    return clean(doc)


@api.get("/client/homework")
async def client_homework(user: dict = Depends(require_role("client"))):
    docs = await db.homework.find({"client_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return docs


@api.patch("/client/homework/{hw_id}")
async def update_homework(hw_id: str, patch: HomeworkStatusIn,
                          user: dict = Depends(require_role("client"))):
    await db.homework.update_one(
        {"id": hw_id, "client_id": user["id"]}, {"$set": patch.model_dump()}
    )
    doc = await db.homework.find_one({"id": hw_id}, {"_id": 0})
    return doc


@api.get("/client/session-notes")
async def client_notes(user: dict = Depends(require_role("client"))):
    docs = await db.session_notes.find(
        {"client_id": user["id"], "shared_with_client": True}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return docs


@api.get("/client/resources")
async def client_resources(user: dict = Depends(require_role("client"))):
    docs = await db.resources.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs


# ---------- Startup: seed data ----------
async def seed_admin_and_data():
    # Ensure unique index
    try:
        await db.users.create_index("email", unique=True)
        await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
        await db.login_attempts.create_index("identifier")
    except Exception as e:
        logger.warning(f"Index setup: {e}")

    # Therapist admin
    t_email = os.environ["ADMIN_EMAIL"].lower()
    t_pw = os.environ["ADMIN_PASSWORD"]
    therapist = await db.users.find_one({"email": t_email})
    if not therapist:
        therapist_id = str(uuid.uuid4())
        therapist = {
            "id": therapist_id, "email": t_email, "name": "Dr. Anaya Verma",
            "role": "therapist",
            "password_hash": hash_password(t_pw),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(therapist)
    elif not verify_password(t_pw, therapist["password_hash"]):
        await db.users.update_one({"email": t_email},
                                   {"$set": {"password_hash": hash_password(t_pw)}})

    # Sample client
    c_email = os.environ["CLIENT_SEED_EMAIL"].lower()
    c_pw = os.environ["CLIENT_SEED_PASSWORD"]
    client_doc = await db.users.find_one({"email": c_email})
    if not client_doc:
        client_id = str(uuid.uuid4())
        client_doc = {
            "id": client_id, "email": c_email, "name": "Maya Iyer",
            "role": "client",
            "password_hash": hash_password(c_pw),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(client_doc)
    elif not verify_password(c_pw, client_doc["password_hash"]):
        await db.users.update_one({"email": c_email},
                                   {"$set": {"password_hash": hash_password(c_pw)}})

    # Public therapist profile
    if not await db.therapist_profile.find_one({"slug": "primary"}):
        await db.therapist_profile.insert_one({
            "slug": "primary",
            "name": "Dr. Anaya Verma",
            "title": "Licensed Psychotherapist",
            "personal_note": (
                "I believe therapy is a space where you can show up just as you are, "
                "without the pressure to have everything figured out. Whether you're "
                "navigating a difficult chapter, feeling overwhelmed, or simply trying "
                "to understand yourself better, our conversations will move at a pace "
                "that feels right for you."
            ),
            "approach": (
                "My approach is person-centred and collaborative. Rather than telling "
                "you what to do, I aim to create a safe, supportive space where we can "
                "explore your thoughts, emotions, and experiences together. Every "
                "person's journey is different, and therapy should reflect that."
            ),
            "qualifications": [
                {"label": "Education", "value": "M.Phil. Clinical Psychology, NIMHANS"},
                {"label": "Experience", "value": "9 years of one-on-one therapeutic practice"},
                {"label": "Memberships", "value": "Indian Association of Clinical Psychologists"},
                {"label": "Languages", "value": "English, Hindi, Marathi"},
                {"label": "Specialisations", "value": "Anxiety, Grief, Relational trauma, Burnout"},
            ],
            "areas": ["Anxiety", "Stress", "Self-esteem", "Grief", "Burnout",
                      "Relationships", "Life transitions", "Identity"],
            "pillars": [
                {"title": "Compassion",
                 "body": "You deserve a space where you feel heard without judgement."},
                {"title": "Collaboration",
                 "body": "Therapy is something we build together."},
                {"title": "Evidence-Based",
                 "body": "My work is informed by research and tailored to your needs."},
                {"title": "Growth",
                 "body": "Progress doesn't have to be perfect to be meaningful."},
            ],
        })

    # Sample public resources
    if await db.resources.count_documents({}) == 0:
        samples = [
            {"title": "Understanding Anxiety: A Gentle Primer", "category": "Anxiety",
             "kind": "article", "is_public": True,
             "description": "A calm, plain-language introduction to how anxiety works and what helps.",
             "body": "Anxiety is your body's way of saying it cares about the outcome…"},
            {"title": "A Box Breathing Exercise", "category": "Coping tools",
             "kind": "article", "is_public": True,
             "description": "A four-count breathing pattern you can return to during difficult moments.",
             "body": "Breathe in for four counts. Hold for four. Exhale for four. Rest for four."},
            {"title": "The Reflection Journal Prompt Library", "category": "Reflection",
             "kind": "pdf", "is_public": True,
             "description": "Twelve gentle prompts to explore, each written to feel less like homework and more like a conversation.",
             "url": "#"},
            {"title": "Grief and the Shape of a Day", "category": "Grief",
             "kind": "article", "is_public": True,
             "description": "A short essay on making room for grief without letting it define you.",
             "body": "Grief rarely arrives on a schedule…"},
            {"title": "Sleep as a Form of Care", "category": "Wellbeing",
             "kind": "article", "is_public": True,
             "description": "How rest quietly shapes our capacity for feeling.",
             "body": "The body remembers what the mind cannot always name."},
            {"title": "When You Feel Like You're Not Doing Enough", "category": "Self-esteem",
             "kind": "article", "is_public": True,
             "description": "A tender read for the days that feel small.",
             "body": "Some days are for tending, not producing."},
        ]
        for s in samples:
            s["id"] = str(uuid.uuid4())
            s["created_by"] = therapist["id"]
            s["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.resources.insert_many(samples)

    # Sample appointments, homework, notes, reflection for client
    if await db.appointments.count_documents({"client_id": client_doc["id"]}) == 0:
        today = datetime.now(timezone.utc).date()
        appts = [
            {"date": (today + timedelta(days=3)).isoformat(), "time": "10:00",
             "status": "scheduled", "mode": "online"},
            {"date": (today - timedelta(days=4)).isoformat(), "time": "10:00",
             "status": "completed", "mode": "online"},
            {"date": (today - timedelta(days=11)).isoformat(), "time": "10:00",
             "status": "completed", "mode": "online"},
        ]
        for a in appts:
            doc = Appointment(
                client_id=client_doc["id"], therapist_id=therapist["id"],
                date=a["date"], time=a["time"], status=a["status"], mode=a["mode"],
            ).model_dump()
            await db.appointments.insert_one(doc)

    if await db.session_notes.count_documents({"client_id": client_doc["id"]}) == 0:
        await db.session_notes.insert_one({
            "id": str(uuid.uuid4()),
            "therapist_id": therapist["id"],
            "client_id": client_doc["id"],
            "summary": ("We spoke about the weight of expectations at work, and how it "
                        "shows up in the body first. You named the feeling as 'a held breath.' "
                        "We practised naming small moments of rest between demands."),
            "homework": "Notice one 'held breath' moment each day. Write down what preceded it.",
            "resources": [],
            "shared_with_client": True,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=4)).isoformat(),
        })

    if await db.homework.count_documents({"client_id": client_doc["id"]}) == 0:
        await db.homework.insert_one({
            "id": str(uuid.uuid4()),
            "therapist_id": therapist["id"],
            "client_id": client_doc["id"],
            "title": "A gentle noticing practice",
            "description": ("Each evening, write down one moment from your day that felt tender. "
                            "Not big, not conclusive — just noticed."),
            "type": "writing",
            "items": None,
            "due_date": None,
            "completed": False,
            "completed_items": [],
            "client_notes": "",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat(),
        })
        await db.homework.insert_one({
            "id": str(uuid.uuid4()),
            "therapist_id": therapist["id"],
            "client_id": client_doc["id"],
            "title": "Grounding checklist",
            "description": "When overwhelm arrives, work through these steps gently.",
            "type": "checklist",
            "items": ["Name five things you can see", "Name four you can touch",
                      "Name three you can hear", "Name two you can smell",
                      "Take one slow breath"],
            "due_date": None,
            "completed": False,
            "completed_items": [],
            "client_notes": "",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
        })

    if await db.reflections.count_documents({"user_id": client_doc["id"]}) == 0:
        await db.reflections.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": client_doc["id"],
            "title": "The morning walk",
            "body": ("I walked without music today. Everything felt louder and softer at once. "
                     "I noticed the light on the wall and let it be enough."),
            "mood": "gentle",
            "is_draft": False,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
        })

    if await db.consultation_requests.count_documents({}) == 0:
        await db.consultation_requests.insert_many([
            {"id": str(uuid.uuid4()), "name": "Rhea Kapoor",
             "email": "rhea@example.com",
             "reason": "Recent transition, feeling ungrounded.",
             "preferred_time": "Weekday evenings", "status": "new",
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Sameer Ahuja",
             "email": "sameer@example.com",
             "reason": "Work burnout and disturbed sleep.",
             "preferred_time": "Saturday mornings", "status": "new",
             "created_at": datetime.now(timezone.utc).isoformat()},
        ])


# ---------- Register router + CORS + startup ----------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origin_regex=".*",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    try:
        await seed_admin_and_data()
        logger.info("Seed complete.")
    except Exception as e:
        logger.exception(f"Seed failed: {e}")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
