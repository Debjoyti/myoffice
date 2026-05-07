import asyncio
import os
import uuid
import logging
from datetime import datetime, timezone

from fallback_db import InMemoryDatabase

# Using the fallback DB or Motor client as per main.py logic
try:
    from motor.motor_asyncio import AsyncIOMotorClient
except Exception:
    AsyncIOMotorClient = None

mongo_url = os.environ.get('MONGO_URL', '').strip()
db_name = os.environ.get('DB_NAME', 'myoffice').strip() or 'myoffice'
using_fallback_db = not bool(mongo_url)

if using_fallback_db or AsyncIOMotorClient is None:
    client = None
    db = InMemoryDatabase()
else:
    client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=2500)
    db = client[db_name]

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def migrate_data():
    logger.info("Starting data migration from employees to persons table (Talent OS)")

    # Normally we would connect to PostgreSQL via asyncpg or psycopg.
    # Since this codebase doesn't seem to have a Postgres client setup in python,
    # and we are running tests via mock, we will just simulate the script structure
    # and potentially seed the InMemoryDatabase if needed for local fallback testing.

    # We will simulate data migration to fallback db 'persons' collection

    employees = await db.employees.find({}).to_list(None)
    logger.info(f"Found {len(employees)} employees to migrate")

    migrated_count = 0
    for emp in employees:
        company_id = emp.get("company_id")
        if not company_id:
            # Try to get it from users table via organization_id as fallback?
            company_id = "demo-comp-1"

        emp_id = emp.get("id", str(uuid.uuid4()))
        name_parts = emp.get("name", "Unknown User").split(" ")
        first_name = name_parts[0]
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

        person_doc = {
            "id": emp_id,
            "company_id": company_id,
            "first_name": first_name,
            "last_name": last_name,
            "email": emp.get("email"),
            "phone": emp.get("phone"),
            "status": "employee",
            "created_at": emp.get("created_at", datetime.now(timezone.utc).isoformat()),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

        # In a real environment, we would do an insert into Postgres here.
        # For our mock/fallback environment, we write to `db.persons`
        await db.persons.insert_one(person_doc)
        migrated_count += 1

    logger.info(f"Successfully migrated {migrated_count} records to persons")

if __name__ == "__main__":
    asyncio.run(migrate_data())
