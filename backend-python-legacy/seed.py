"""Startup seed data.

Two tiers, controlled by config.SEED_DEMO_DATA:

1. Always applied (real product content, safe in production):
   the therapist account named by ADMIN_EMAIL/ADMIN_PASSWORD, the public
   therapist profile copy, and the public resource library articles.
2. Demo-only (SEED_DEMO_DATA, default true — set false in production):
   the sample client account plus its sample appointments, session note,
   homework, reflection, and the sample consultation-request inbox items.
"""
import logging
import uuid
from datetime import datetime, timedelta, timezone

from config import (ADMIN_EMAIL, ADMIN_PASSWORD, CLIENT_SEED_EMAIL,
                     CLIENT_SEED_PASSWORD, SEED_DEMO_DATA)
from db import db
from security import hash_password, verify_password

logger = logging.getLogger("borrowed_blues.seed")


async def seed() -> None:
    now = datetime.now(timezone.utc)

    # ---- Therapist admin (real account — always applied) ----
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

    # ---- Sample client (demo-only) ----
    client_doc = None
    if SEED_DEMO_DATA:
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

    # ---- Sample public resources (upserted by title so copy stays current) ----
    samples = [
        {"title": "Understanding Anxiety: A Gentle Primer", "category": "Anxiety",
         "kind": "article", "is_public": True,
         "description": "A calm, plain-language introduction to how anxiety works and what helps.",
         "body": (
             "Anxiety is your body's way of saying it cares about the outcome. It shows up "
             "before the things that matter to you: a conversation you've been putting off, a "
             "result you're waiting on, a room full of people you don't know yet. The racing "
             "heart, the tight chest, the mind that won't stop rehearsing worst cases. None of "
             "it means something is wrong with you. It means your nervous system is doing "
             "exactly what it evolved to do, just a little too loudly for the size of the "
             "actual threat.\n\n"
             "Most people find it helps to notice anxiety early, before it has built a full "
             "story. A tight jaw, a shallow breath, a sudden urge to check your phone: these "
             "are often the opening moves, long before the thought \"something bad is going to "
             "happen\" arrives. Catch it there and you have more room to respond gently instead "
             "of reactively.\n\n"
             "Anxiety also tends to shrink slightly the moment it's named out loud, even just "
             "to yourself. \"This is anxiety, not danger\" is a small sentence that does a "
             "surprising amount of work. It reminds the thinking part of your brain that it's "
             "allowed to stay in the room.\n\n"
             "And it isn't a problem you solve in one sitting. It responds to repetition, the "
             "same slow breath, the same honest check-in, the same small act of staying "
             "present, more than it responds to any single insight. You don't have to make it "
             "disappear. You just have to keep meeting it with a little more steadiness each "
             "time."
         )},
        {"title": "A Box Breathing Exercise", "category": "Coping tools",
         "kind": "article", "is_public": True,
         "description": "A four-count breathing pattern you can return to during difficult moments.",
         "body": (
             "Box breathing is a slow, even pattern that gives your nervous system something "
             "predictable to hold onto when everything else feels uncertain. Therapists use "
             "it. So do athletes, and for the same reason: it's simple enough to do anywhere, "
             "and it works on the body directly, without needing you to think your way out of "
             "anything first.\n\n"
             "The pattern:\n\n"
             "Breathe in slowly through your nose for a count of four.\n"
             "Hold that breath gently for a count of four. No straining, just a pause.\n"
             "Breathe out slowly through your mouth for a count of four.\n"
             "Hold the empty breath for a count of four before beginning again.\n\n"
             "Picture each phase as one side of a box, tracing the edges as you go. Repeat the "
             "cycle for four to six rounds, or for as long as feels steadying. If four counts "
             "feels like a stretch at first, three is fine. The rhythm matters more than the "
             "exact number.\n\n"
             "Use it anywhere: before a hard conversation, in the middle of a spiraling "
             "thought, or simply as a way to close out the day. There's no wrong time to come "
             "back to your breath."
         )},
        {"title": "The Reflection Journal Prompt Library", "category": "Reflection",
         "kind": "article", "is_public": True,
         "description": "Twelve gentle prompts to explore, each written to feel less like homework and more like a conversation.",
         "body": (
             "These prompts aren't a checklist. Pick whichever one meets you where you are "
             "today. There's no right length for an answer; a single sentence counts.\n\n"
             "1. What is one thing I'm carrying today that no one else can see?\n"
             "2. When did I last feel fully like myself, and what made that possible?\n"
             "3. What would I say to a friend who felt the way I feel right now?\n"
             "4. What am I avoiding, and what am I afraid it means about me?\n"
             "5. What's a small thing that went right today, even if the day was hard?\n"
             "6. Where in my body am I holding tension right now, and what might it be saying?\n"
             "7. What do I need more of this week: rest, connection, structure, or space?\n"
             "8. What's a story I keep telling myself that might not be entirely true?\n"
             "9. Who or what made me feel steady recently?\n"
             "10. What would 'enough' look like today, instead of 'everything'?\n"
             "11. What's one boundary I wish I had held more firmly this week?\n"
             "12. If I could offer myself one piece of kindness right now, what would it be?\n\n"
             "Return to these as often as you like. The point isn't to finish them. It's to "
             "keep the conversation with yourself open."
         )},
        {"title": "Grief and the Shape of a Day", "category": "Grief",
         "kind": "article", "is_public": True,
         "description": "A short essay on making room for grief without letting it define you.",
         "body": (
             "Grief rarely arrives on a schedule. It doesn't announce itself at the start of "
             "the day and leave politely by evening. More often it shows up sideways, in a "
             "smell, a song, an empty chair at a table, long after you thought you'd already "
             "done the crying you needed to do.\n\n"
             "One of the hardest parts of grief is the expectation that it should look like "
             "something: a clean arc, a set number of stages, a date by which you should feel "
             "'better.' In practice, grief is less like a line and more like weather. Some days "
             "are overcast and manageable. Others arrive as a sudden storm you didn't see "
             "coming, even years later.\n\n"
             "It can help to think of grief not as something to get through, but as something "
             "that gets folded into the shape of an ordinary day, sitting alongside the "
             "laundry, the meetings, the small pleasures, rather than replacing them entirely. "
             "You're allowed to laugh in the same week you cry. You're allowed to feel lighter "
             "on a Tuesday and heavier on a Thursday, with no explanation required.\n\n"
             "Making room for grief is not the same as letting it define you. You can carry "
             "loss and still reach for the rest of your life at the same time. Neither "
             "cancels the other out."
         )},
        {"title": "Sleep as a Form of Care", "category": "Wellbeing",
         "kind": "article", "is_public": True,
         "description": "How rest quietly shapes our capacity for feeling.",
         "body": (
             "The body remembers what the mind cannot always name. Long before we can put "
             "words to why we feel raw or short-tempered or strangely fragile, sleep has "
             "usually already told the story. One bad night rarely undoes us, but a stretch of "
             "them quietly narrows everything: patience, perspective, even our sense of "
             "whether things are actually as bad as they feel.\n\n"
             "It's tempting to treat sleep as the thing you sacrifice first when life gets "
             "full, as though rest were a reward you earn after everything else is handled. In "
             "practice it works the other way around. Sleep is closer to the foundation that "
             "makes handling everything else possible at all.\n\n"
             "You don't need a perfect routine to start caring for your sleep, just a few "
             "honest questions. What time do I actually wind down, versus when I tell myself I "
             "will? What's the last thing my mind is doing before I try to fall asleep: "
             "scrolling, worrying, planning tomorrow? Does my body get any signal that the day "
             "is closing, or does it go from full speed to lights-off with nothing in "
             "between?\n\n"
             "Rest is not indulgent. It's one of the quieter, steadier forms of care you can "
             "offer yourself, and one that makes almost everything else feel more possible."
         )},
        {"title": "When You Feel Like You're Not Doing Enough", "category": "Self-esteem",
         "kind": "article", "is_public": True,
         "description": "A tender read for the days that feel small.",
         "body": (
             "Some days are for tending, not producing. That's a hard sentence to believe when "
             "the voice in your head keeps a running tally of everything left undone: the "
             "reply you haven't sent, the goal you haven't hit, the version of yourself you "
             "imagine other people are further along toward becoming.\n\n"
             "Enough is rarely a fixed amount. It moves depending on how much you're already "
             "carrying, how much sleep you got, what else is quietly asking for your attention "
             "that no one else can see. The same task that feels easy on a good week can feel "
             "enormous on a hard one, and that's not a failure of willpower. It's just what "
             "being human under real conditions looks like.\n\n"
             "If you're in a season where everything feels like not enough, it can help to ask "
             "a smaller question than 'am I doing enough': what is one true thing I did today "
             "to take care of myself or someone else? Getting out of bed counts. Answering one "
             "message counts. Simply making it to the end of a hard day counts.\n\n"
             "You are allowed to measure your days by care instead of output, at least "
             "sometimes. Productivity was never meant to be the only unit that mattered."
         )},
    ]
    for s in samples:
        existing = await db.resources.find_one({"title": s["title"]})
        if existing:
            await db.resources.update_one({"title": s["title"]}, {"$set": s})
        else:
            s["id"] = str(uuid.uuid4())
            s["created_by"] = therapist["id"]
            s["created_at"] = now.isoformat()
            await db.resources.insert_one(s)

    # ---- Sample appointments / notes / homework / reflection / requests (demo-only) ----
    if SEED_DEMO_DATA and client_doc:
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
