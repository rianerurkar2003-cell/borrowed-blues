"""Public router: things anyone can hit without auth."""
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter

from db import db
from models import ConsultationRequestIn, clean

router = APIRouter(tags=["public"])


@router.get("/")
async def root():
    return {"service": "Borrowed Blues API", "status": "ok"}


@router.get("/therapist/profile")
async def public_therapist_profile():
    doc = await db.therapist_profile.find_one({"slug": "primary"}) or {}
    return clean(doc) or {}


@router.get("/resources/public")
async def public_resources(category: Optional[str] = None, q: Optional[str] = None):
    query: dict = {"is_public": True}
    if category and category != "all":
        query["category"] = category
    docs = await db.resources.find(query, {"_id": 0}).to_list(200)
    if q:
        needle = q.lower()
        docs = [d for d in docs
                if needle in d.get("title", "").lower()
                or needle in d.get("description", "").lower()]
    return docs


@router.post("/consultation-requests")
async def create_consultation(payload: ConsultationRequestIn):
    doc = {
        "id": str(uuid.uuid4()),
        **payload.model_dump(),
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.consultation_requests.insert_one(doc)
    return clean(doc)
