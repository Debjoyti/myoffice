import asyncio
import uuid
import random
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = "mongodb://localhost:27017"
DATABASE_NAME = "myoffice"
client = AsyncIOMotorClient(MONGO_URL)
db = client[DATABASE_NAME]

async def seed_production_grade():
    print("STARTING PRODUCTION-GRADE IATF SEEDING (100+ RECORDS)...")
    
    org_id = "default"
    hr_id = "demo_hr_001"
    now = datetime.now(timezone.utc)
    
    # 1. Responsibility Matrix (M19)
    resp_matrix = {
        "id": str(uuid.uuid4()),
        "metadata": {
            "version": "1.0", "created_by": hr_id, "company_id": org_id,
            "status": "active", "created_at": now.isoformat(), "updated_at": now.isoformat(), "approved_by": hr_id
        },
        "clauses": [
            {"iatf_clause": "5.3.1", "responsibility": "Organizational roles, responsibilities, and authorities", "role": "CEO / HR Head"},
            {"iatf_clause": "7.1.5", "responsibility": "Monitoring and measuring resources", "role": "Quality Manager"},
            {"iatf_clause": "7.2", "responsibility": "Competence management", "role": "HR Manager"},
            {"iatf_clause": "8.5.1", "responsibility": "Control of production and service provision", "role": "Production Head"},
            {"iatf_clause": "9.1.2.1", "responsibility": "Customer satisfaction", "role": "Sales Head"}
        ]
    }
    await db.iatf_responsibility_matrix.delete_many({})
    await db.iatf_responsibility_matrix.insert_one(resp_matrix)
    print("DONE: Seeded Responsibility Matrix")

    # 2. OJT Records (M14) - 50 Records
    ojt_topics = ["CNC Programming", "Safety in Welding", "Visual Standards", "Micrometer Usage", "Forklift Safety"]
    trainers = ["TR_CNC_01", "TR_SAFE_02", "TR_QA_03"]
    ojts = []
    for i in range(50):
        ojts.append({
            "id": str(uuid.uuid4()),
            "employee_id": f"EMP_IATF_{random.randint(1000, 1099)}",
            "metadata": {
                "version": "1.0", "created_by": hr_id, "company_id": org_id,
                "status": "active", "created_at": (now - timedelta(days=random.randint(1, 90))).isoformat(), "updated_at": now.isoformat()
            },
            "topic": random.choice(ojt_topics),
            "trainer_id": random.choice(trainers),
            "start_date": (now - timedelta(days=30)).strftime("%Y-%m-%d"),
            "end_date": now.strftime("%Y-%m-%d"),
            "hours_completed": random.uniform(4.0, 40.0),
            "supervisor_comment": "Employee demonstrated high proficiency in the practical exam.",
            "status": "completed"
        })
    await db.iatf_ojt_records.delete_many({})
    await db.iatf_ojt_records.insert_many(ojts)
    print(f"DONE: Seeded {len(ojts)} OJT Records")

    # 3. Motivation Actions (M16) - 20 Records
    actions = []
    for i in range(20):
        actions.append({
            "id": str(uuid.uuid4()),
            "metadata": {
                "version": "1.0", "created_by": hr_id, "company_id": org_id,
                "status": "active", "created_at": now.isoformat(), "updated_at": now.isoformat()
            },
            "employee_id": f"EMP_IATF_{random.randint(1000, 1099)}",
            "action_type": random.choice(["Reward", "Recognition", "Training", "Promotion"]),
            "description": "Exemplary performance during the Q3 Audits. Employee awarded Best Performance certificate.",
            "budget_utilized": random.uniform(500, 5000),
            "impact_assessment": "High morale observed in the department."
        })
    await db.iatf_motivation_actions.delete_many({})
    await db.iatf_motivation_actions.insert_many(actions)
    print(f"DONE: Seeded {len(actions)} Motivation Actions")

    print("\nSUCCESS: PRODUCTION-GRADE SEEDING COMPLETED!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_production_grade())
