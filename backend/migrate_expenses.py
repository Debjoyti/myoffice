import asyncio
from main import db
import uuid
from datetime import datetime, timezone

async def migrate():
    # 1. Update existing expenses
    await db.expenses.update_many(
        {"status": "pending"},
        {"$set": {"status": "submitted", "ai_score": 10.0, "ai_flags": [], "payment_method": "direct"}}
    )

    # 2. Add default categories if empty
    categories = ["internet", "travel", "fuel", "meals", "miscellaneous"]

    # We will just insert them for the first organization we find
    org = await db.organizations.find_one({})
    if not org:
        return

    company_id = "default_company" # fallback

    cats = await db.expense_categories.find({}).to_list(10)
    if len(cats) == 0:
        for c in categories:
            await db.expense_categories.insert_one({
                "id": str(uuid.uuid4()),
                "company_id": company_id,
                "organization_id": org["id"],
                "name": c,
                "max_limit": 5000.0 if c != "travel" else 20000.0,
                "requires_receipt": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
    print("Migration complete")

if __name__ == "__main__":
    asyncio.run(migrate())
