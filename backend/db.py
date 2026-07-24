"""MongoDB client + startup index creation."""
import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from config import MONGO_URL, DB_NAME

logger = logging.getLogger("borrowed_blues.db")

client: AsyncIOMotorClient = AsyncIOMotorClient(MONGO_URL)
db: AsyncIOMotorDatabase = client[DB_NAME]


async def create_indexes() -> None:
    """Ensure indexes needed for correctness and query performance."""
    try:
        await db.users.create_index("email", unique=True)
        await db.users.create_index("role")
        await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
        await db.login_attempts.create_index("identifier")
        # Portal query hot-paths
        await db.appointments.create_index([("therapist_id", 1), ("date", 1)])
        await db.appointments.create_index([("client_id", 1), ("date", 1)])
        await db.appointments.create_index("status")
        await db.session_notes.create_index([("client_id", 1), ("created_at", -1)])
        await db.homework.create_index([("client_id", 1), ("created_at", -1)])
        await db.reflections.create_index([("user_id", 1), ("created_at", -1)])
        await db.resources.create_index([("is_public", 1), ("category", 1)])
        await db.consultation_requests.create_index([("status", 1), ("created_at", -1)])
    except Exception as e:
        logger.warning(f"Index setup failed: {e}")
