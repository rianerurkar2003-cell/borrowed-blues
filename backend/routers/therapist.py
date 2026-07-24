"""Therapist router: /api/therapist/*"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from db import db
from deps import require_role
from models import (AppointmentIn, HomeworkIn, ResourceIn, SessionSummaryIn, clean)

router = APIRouter(prefix="/therapist", tags=["therapist"])


@router.get("/dashboard")
async def dashboard(user: dict = Depends(require_role("therapist"))):
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
    client_count = await db.users.count_documents({"role": "client"})
    return {
        "today": todays, "upcoming": upcoming, "requests": requests,
        "reflections": reflections, "client_count": client_count,
    }


@router.get("/clients")
async def list_clients(user: dict = Depends(require_role("therapist"))):
    return await db.users.find({"role": "client"}, {"_id": 0, "password_hash": 0}).to_list(500)


@router.get("/appointments")
async def appointments(user: dict = Depends(require_role("therapist"))):
    return await db.appointments.find(
        {"therapist_id": user["id"]}, {"_id": 0}
    ).sort("date", 1).to_list(500)


@router.post("/appointments")
async def create_appointment(payload: AppointmentIn, user: dict = Depends(require_role("therapist"))):
    if not payload.client_id:
        raise HTTPException(status_code=400, detail="client_id required")
    doc = {
        "id": str(uuid.uuid4()),
        "client_id": payload.client_id, "therapist_id": user["id"],
        "date": payload.date, "time": payload.time,
        "duration_min": payload.duration_min, "mode": payload.mode,
        "status": "scheduled", "notes": payload.notes,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.appointments.insert_one(doc)
    return clean(doc)


@router.patch("/appointments/{appointment_id}")
async def update_appointment(appointment_id: str, patch: dict,
                             user: dict = Depends(require_role("therapist"))):
    allowed_fields = {"date", "time", "duration_min", "mode", "notes", "status"}
    allowed = {k: v for k, v in patch.items() if k in allowed_fields}
    await db.appointments.update_one(
        {"id": appointment_id, "therapist_id": user["id"]}, {"$set": allowed}
    )
    return await db.appointments.find_one({"id": appointment_id}, {"_id": 0})


@router.get("/requests")
async def list_requests(user: dict = Depends(require_role("therapist"))):
    return await db.consultation_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)


@router.patch("/requests/{req_id}")
async def update_request(req_id: str, patch: dict,
                         user: dict = Depends(require_role("therapist"))):
    await db.consultation_requests.update_one(
        {"id": req_id}, {"$set": {"status": patch.get("status", "new")}}
    )
    return {"ok": True}


@router.post("/session-notes")
async def create_note(payload: SessionSummaryIn, user: dict = Depends(require_role("therapist"))):
    doc = {
        "id": str(uuid.uuid4()),
        "therapist_id": user["id"],
        **payload.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.session_notes.insert_one(doc)
    return clean(doc)


@router.get("/session-notes")
async def list_notes(client_id: Optional[str] = None,
                     user: dict = Depends(require_role("therapist"))):
    q: dict = {"therapist_id": user["id"]}
    if client_id:
        q["client_id"] = client_id
    return await db.session_notes.find(q, {"_id": 0}).sort("created_at", -1).to_list(200)


@router.post("/homework")
async def assign_homework(payload: HomeworkIn, user: dict = Depends(require_role("therapist"))):
    doc = {
        "id": str(uuid.uuid4()), "therapist_id": user["id"], **payload.model_dump(),
        "completed": False, "completed_items": [], "client_notes": "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.homework.insert_one(doc)
    return clean(doc)


@router.get("/reflections")
async def all_reflections(user: dict = Depends(require_role("therapist"))):
    return await db.reflections.find({"is_draft": False}, {"_id": 0}).sort("created_at", -1).to_list(200)


@router.post("/resources")
async def create_resource(payload: ResourceIn, user: dict = Depends(require_role("therapist"))):
    doc = {
        "id": str(uuid.uuid4()), **payload.model_dump(),
        "created_by": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.resources.insert_one(doc)
    return clean(doc)
