"""Client router: /api/client/*"""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from db import db
from deps import require_role
from models import AppointmentIn, HomeworkStatusIn, ReflectionIn, clean

router = APIRouter(prefix="/client", tags=["client"])


@router.get("/dashboard")
async def dashboard(user: dict = Depends(require_role("client"))):
    today = datetime.now(timezone.utc).date().isoformat()
    upcoming = await db.appointments.find(
        {"client_id": user["id"], "date": {"$gte": today},
         "status": {"$in": ["scheduled", "requested"]}}, {"_id": 0}
    ).sort("date", 1).limit(5).to_list(5)
    latest_summary = await db.session_notes.find_one(
        {"client_id": user["id"], "shared_with_client": True},
        {"_id": 0}, sort=[("created_at", -1)],
    )
    homework = await db.homework.find(
        {"client_id": user["id"], "completed": False}, {"_id": 0}
    ).sort("created_at", -1).to_list(10)
    reflections = await db.reflections.find(
        {"user_id": user["id"], "is_draft": False}, {"_id": 0}
    ).sort("created_at", -1).limit(3).to_list(3)
    return {"upcoming": upcoming, "latest_summary": latest_summary,
            "homework": homework, "reflections": reflections}


@router.get("/appointments")
async def appointments(user: dict = Depends(require_role("client"))):
    return await db.appointments.find(
        {"client_id": user["id"]}, {"_id": 0}
    ).sort("date", 1).to_list(200)


@router.post("/appointments/request")
async def request_appointment(payload: AppointmentIn, user: dict = Depends(require_role("client"))):
    therapist = await db.users.find_one({"role": "therapist"})
    if not therapist:
        raise HTTPException(status_code=404, detail="No therapist available")
    doc = {
        "id": str(uuid.uuid4()),
        "client_id": user["id"], "therapist_id": therapist["id"],
        "date": payload.date, "time": payload.time,
        "duration_min": payload.duration_min, "mode": payload.mode,
        "notes": payload.notes, "status": "requested",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.appointments.insert_one(doc)
    return clean(doc)


@router.get("/reflections")
async def list_reflections(user: dict = Depends(require_role("client"))):
    return await db.reflections.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)


@router.post("/reflections")
async def create_reflection(payload: ReflectionIn, user: dict = Depends(require_role("client"))):
    doc = {
        "id": str(uuid.uuid4()), "user_id": user["id"], **payload.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.reflections.insert_one(doc)
    return clean(doc)


@router.get("/homework")
async def homework_list(user: dict = Depends(require_role("client"))):
    return await db.homework.find({"client_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)


@router.patch("/homework/{hw_id}")
async def update_homework(hw_id: str, patch: HomeworkStatusIn,
                          user: dict = Depends(require_role("client"))):
    await db.homework.update_one(
        {"id": hw_id, "client_id": user["id"]}, {"$set": patch.model_dump()}
    )
    return await db.homework.find_one({"id": hw_id}, {"_id": 0})


@router.get("/session-notes")
async def notes(user: dict = Depends(require_role("client"))):
    return await db.session_notes.find(
        {"client_id": user["id"], "shared_with_client": True}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)


@router.get("/resources")
async def resources(user: dict = Depends(require_role("client"))):
    return await db.resources.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
