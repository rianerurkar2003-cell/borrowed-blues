"""Startup seed data: therapist admin, sample client, therapist profile,
sample resources / appointments / homework / notes / reflections."""
import logging
import uuid
from datetime import datetime, timedelta, timezone

from config import (ADMIN_EMAIL, ADMIN_PASSWORD, CLIENT_SEED_EMAIL, CLIENT_SEED_PASSWORD)
from db import db
from security import hash_password, verify_password

logger = logging.getLogger("borrowed_blues.seed")


async def seed() -> None:
    now = datetime.now(timezone.utc)

    # ---- Therapist admin ----
    therapist = await db.users.find_one({"email": ADMIN_EMAIL})
    if not therapist:
        therapist = {
            "id": str(uuid.uuid4()), "email": ADMIN_EMAIL, "name": "Anushka Prabhu",
            "role": "therapist",
            "password_hash": hash_password(ADMIN_PASSWORD),
            "created_at": now.isoformat(),
        }
        await db.users.insert_one(therapist)
    else:
        updates: dict = {}
        if not verify_password(ADMIN_PASSWORD, therapist["password_hash"]):
            updates["password_hash"] = hash_password(ADMIN_PASSWORD)
        if therapist.get("name") != "Anushka Prabhu":
            updates["name"] = "Anushka Prabhu"
        if updates:
            await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": updates})

    # ---- Sample client ----
    client_doc = await db.users.find_one({"email": CLIENT_SEED_EMAIL})
    if not client_doc:
        client_doc = {
            "id": str(uuid.uuid4()), "email": CLIENT_SEED_EMAIL, "name": "Maya Iyer",
            "role": "client",
            "password_hash": hash_password(CLIENT_SEED_PASSWORD),
            "created_at": now.isoformat(),
        }
        await db.users.insert_one(client_doc)
    elif not verify_password(CLIENT_SEED_PASSWORD, client_doc["password_hash"]):
        await db.users.update_one(
            {"email": CLIENT_SEED_EMAIL},
            {"$set": {"password_hash": hash_password(CLIENT_SEED_PASSWORD)}},
        )

    # ---- Public therapist profile (upserted on every boot so copy stays fresh) ----
    await db.therapist_profile.update_one(
        {"slug": "primary"},
        {"$set": {
            "slug": "primary",
            "name": "Anushka Prabhu",
            "title": "Counselling Psychologist",
            "personal_note": (
                "My decision to start a private practice came from a desire to "
                "prioritise my own mental health and create a way of working that "
                "allows me to be fully present — with both my clients and in my "
                "personal life. I believe that being able to show up authentically "
                "and without being consumed by work enables me to offer more "
                "thoughtful and compassionate care."
            ),
            "approach": (
                "Beginning therapy can feel daunting, and I will do my best to make "
                "the process as seamless and comfortable as possible. I've built this "
                "practice with the intention of creating a space where people from "
                "all walks of life feel understood and held as they explore the "
                "challenges they are facing — or simply try to make sense of life. "
                "Therapy is not a one-size-fits-all process; each person's needs, "
                "experiences, and goals deserve thoughtful consideration. My approach "
                "is collaborative, flexible, and always open to conversation, so we "
                "can shape the therapeutic journey together in a way that feels "
                "meaningful and supportive for you."
            ),
            "qualifications": [
                {"label": "Education", "value": (
                    "M.A. Psychology (Clinical), Mumbai University · "
                    "Certificate in Solution-Focused Brief Therapy · "
                    "Certificate in Transactional Analysis (TA 101) · "
                    "Certificate course in Gottman's Couple Therapy · "
                    "Certificate course in Rational Emotive Behavioural Therapy "
                    "and Acceptance and Commitment Therapy"
                )},
                {"label": "Experience", "value": (
                    "School Counsellor (1 year) · "
                    "Counselling Psychologist at AYJNISHD (1 year) · "
                    "Private Practice (since May 2025)"
                )},
                {"label": "Languages", "value": "English, Hindi, Marathi"},
            ],
            "areas": [
                "Anxiety", "Depression", "Relationship issues", "Body image issues",
                "Rumination", "Self-image issues", "Stress management",
                "Anger management", "Interpersonal problems",
            ],
            "pillars": [
                {"title": "Compassion", "body": "A space where you feel understood and held, without judgement."},
                {"title": "Collaboration", "body": "Therapy is something we shape together, in conversation."},
                {"title": "Flexibility", "body": "No one-size-fits-all. Your needs and goals guide the work."},
                {"title": "Presence", "body": "Being fully here, so care can be thoughtful and unhurried."},
            ],
        }},
        upsert=True,
    )

    # ---- Sample public resources ----
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
            s["created_at"] = now.isoformat()
        await db.resources.insert_many(samples)

    # ---- Sample appointments for the demo client ----
    if await db.appointments.count_documents({"client_id": client_doc["id"]}) == 0:
        today_date = now.date()
        for date_offset, status in [(3, "scheduled"), (-4, "completed"), (-11, "completed")]:
            await db.appointments.insert_one({
                "id": str(uuid.uuid4()),
                "client_id": client_doc["id"], "therapist_id": therapist["id"],
                "date": (today_date + timedelta(days=date_offset)).isoformat(),
                "time": "10:00", "duration_min": 50, "mode": "online",
                "status": status, "notes": None,
                "created_at": now.isoformat(),
            })

    # ---- Sample session note, homework, reflection ----
    if await db.session_notes.count_documents({"client_id": client_doc["id"]}) == 0:
        await db.session_notes.insert_one({
            "id": str(uuid.uuid4()),
            "therapist_id": therapist["id"], "client_id": client_doc["id"],
            "summary": ("We spoke about the weight of expectations at work, and how it "
                        "shows up in the body first. You named the feeling as 'a held breath.' "
                        "We practised naming small moments of rest between demands."),
            "homework": "Notice one 'held breath' moment each day. Write down what preceded it.",
            "resources": [], "shared_with_client": True,
            "created_at": (now - timedelta(days=4)).isoformat(),
        })

    if await db.homework.count_documents({"client_id": client_doc["id"]}) == 0:
        await db.homework.insert_many([
            {
                "id": str(uuid.uuid4()),
                "therapist_id": therapist["id"], "client_id": client_doc["id"],
                "title": "A gentle noticing practice",
                "description": "Each evening, write down one moment from your day that felt tender.",
                "type": "writing", "items": None, "due_date": None,
                "completed": False, "completed_items": [], "client_notes": "",
                "created_at": (now - timedelta(days=3)).isoformat(),
            },
            {
                "id": str(uuid.uuid4()),
                "therapist_id": therapist["id"], "client_id": client_doc["id"],
                "title": "Grounding checklist",
                "description": "When overwhelm arrives, work through these steps gently.",
                "type": "checklist",
                "items": ["Name five things you can see", "Name four you can touch",
                          "Name three you can hear", "Name two you can smell",
                          "Take one slow breath"],
                "due_date": None, "completed": False, "completed_items": [], "client_notes": "",
                "created_at": (now - timedelta(days=1)).isoformat(),
            },
        ])

    if await db.reflections.count_documents({"user_id": client_doc["id"]}) == 0:
        await db.reflections.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": client_doc["id"],
            "title": "The morning walk",
            "body": ("I walked without music today. Everything felt louder and softer at once. "
                     "I noticed the light on the wall and let it be enough."),
            "mood": "gentle", "is_draft": False,
            "created_at": (now - timedelta(days=2)).isoformat(),
        })

    if await db.consultation_requests.count_documents({}) == 0:
        await db.consultation_requests.insert_many([
            {"id": str(uuid.uuid4()), "name": "Rhea Kapoor",
             "email": "rhea@example.com",
             "reason": "Recent transition, feeling ungrounded.",
             "preferred_time": "Weekday evenings", "status": "new",
             "created_at": now.isoformat()},
            {"id": str(uuid.uuid4()), "name": "Sameer Ahuja",
             "email": "sameer@example.com",
             "reason": "Work burnout and disturbed sleep.",
             "preferred_time": "Saturday mornings", "status": "new",
             "created_at": now.isoformat()},
        ])
