"""Shared Pydantic input models."""
from typing import Literal, Optional, List
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember: Optional[bool] = False


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    # Public registration always creates a client account. Therapist accounts
    # are provisioned only via ADMIN_EMAIL/ADMIN_PASSWORD in seed.py — never
    # take the role from client input, or anyone could self-register as
    # "therapist" and read every client's journal entries and session notes.


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class AppointmentIn(BaseModel):
    client_id: Optional[str] = None
    date: str
    time: str
    duration_min: int = 50
    mode: Literal["online", "in-person"] = "online"
    notes: Optional[str] = None


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
    items: Optional[List[str]] = None
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


def clean(doc: Optional[dict]) -> Optional[dict]:
    """Strip Mongo internals + password hash before returning to a client."""
    if not doc:
        return doc
    doc.pop("_id", None)
    doc.pop("password_hash", None)
    return doc
