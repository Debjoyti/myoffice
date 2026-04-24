import asyncio
import uuid
import random
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection
MONGO_URL = "mongodb://localhost:27017" # Update if different
DATABASE_NAME = "myoffice"
client = AsyncIOMotorClient(MONGO_URL)
db = client[DATABASE_NAME]

async def seed_iatf_data():
    print("START: IATF Compliance Seeding with VOLUME...")
    
    # Matching the logged-in user's organization_id
    company_id = "default"
    hr_id = "demo_hr_001"
    now = datetime.now(timezone.utc).isoformat()
    
    # 1. ANNUAL TRAINING CALENDAR (Module 6)
    # 100 entries for the calendar
    programs = []
    months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    topics = ["Quality Policy", "Kaizen 5S", "Safety Protocols", "Cyber Awareness", "Soft Skills", "Technical Precision", "Audit Prep", "Customer Service", "Leadership", "Tool Handling"]
    
    for i in range(100):
        programs.append({
            "month": random.choice(months),
            "topic": f"{random.choice(topics)} - Level {random.randint(1,4)}",
            "target_audience": random.choice(["Operators", "Managers", "Engineers", "All Staff"]),
            "trainer": random.choice(["Internal", "External Expert", "QA Lead", "Consultant"]),
            "planned_date": (datetime.now() + timedelta(days=random.randint(1, 365))).strftime("%Y-%m-%d"),
            "status": random.choice(["planned", "completed", "confirmed"])
        })

    training_calendar = {
        "id": str(uuid.uuid4()),
        "metadata": {
            "version": "1.0", "created_by": hr_id, "company_id": company_id,
            "status": "active", "created_at": now, "updated_at": now, "approved_by": hr_id
        },
        "year": 2026,
        "programs": programs
    }
    await db.iatf_training_calendar.delete_many({})
    await db.iatf_training_calendar.insert_one(training_calendar)
    print(f"DONE: Seeded 1 Training Calendar with {len(programs)} programs")

    # 2. SKILL MATRIX (Module 17)
    # 100 Employees
    skills_list = ["Assembly", "Quality Hub", "Logistics", "Safety", "Soft Skills", "Inspection", "Packing"]
    skill_matrix = []
    for i in range(100):
        emp_id = f"EMP_IATF_{1000 + i}"
        skill_matrix.append({
            "id": str(uuid.uuid4()),
            "employee_id": emp_id,
            "metadata": {
                "version": "1.1", "created_by": hr_id, "company_id": company_id,
                "status": "active", "created_at": now, "updated_at": now, "approved_by": hr_id
            },
            "skills": [{"skill": s, "level": random.randint(1, 4)} for s in skills_list]
        })
    await db.iatf_skill_matrix.delete_many({})
    await db.iatf_skill_matrix.insert_many(skill_matrix)
    print(f"DONE: Seeded Skill Matrix for {len(skill_matrix)} Employees")

    # 3. KAIZEN SUGGESTIONS (Module 7)
    # 100 Kaizens
    kaizens = []
    themes = ["Quality Improvement", "Safety", "Environment", "Cost Reduction", "Productivity"]
    impacts = ["Scrap Reduction", "Time Saving", "injury Prevention", "Carbon Footprint", "Process Flow"]
    
    for i in range(100):
        kaizens.append({
            "id": str(uuid.uuid4()),
            "employee_id": f"EMP_IATF_{random.randint(1000, 1099)}",
            "metadata": {
                "version": "1.0", "created_by": hr_id, "company_id": company_id,
                "status": "active", "created_at": now, "updated_at": now, "approved_by": hr_id
            },
            "theme": random.choice(themes),
            "problem_description": f"Inefficiency detected in line sector {random.randint(1, 20)}.",
            "suggestion_details": "Implement automated sensor tracking for better data accuracy.",
            "status": random.choice(["pending", "approved", "rejected", "implemented"]),
            "savings_estimated": round(random.uniform(1000, 50000), 2),
            "impact_area": random.choice(impacts)
        })
    await db.iatf_kaizen_suggestion.delete_many({})
    await db.iatf_kaizen_suggestion.insert_many(kaizens)
    print(f"DONE: Seeded {len(kaizens)} Kaizen Suggestions")

    # 4. TURTLE DIAGRAM (Module 3)
    # 10 Turtle Diagrams
    turtles = []
    processes = ["Training", "Internal Audit", "Supplier Quality", "Maintenance", "Sales", "Design", "Logistics", "HR Management", "Production", "Quality Control"]
    for proc in processes:
        turtles.append({
            "id": str(uuid.uuid4()),
            "metadata": {
                "version": "2.1", "created_by": hr_id, "company_id": company_id,
                "status": "active", "created_at": now, "updated_at": now, "approved_by": hr_id
            },
            "process_name": proc,
            "inputs": [f"{proc} Requests", "Stakeholder Feedback", "Resource Schedule"],
            "outputs": [f"{proc} Reports", "Certificate of Compliance", "Audit findings"],
            "resources": ["ERP System", "Meeting Room", "Trained Staff"],
            "methods": ["SOP-01", "Work Instruction", "Process Flow Chart"],
            "personnel": ["Process Owner", "HR Admin", "Quality Manager"],
            "kpis": ["Success Rate > 90%", "Zero Non-conformity", "Timely Completion"]
        })
    await db.iatf_turtle_diagram.delete_many({})
    await db.iatf_turtle_diagram.insert_many(turtles)
    print(f"DONE: Seeded {len(turtles)} Turtle Diagrams")


    # 5. GAP ANALYSIS FOR AUDIT DASHBOARD (Module 1)
    # We need to make sure the users exist to cause gaps and pending kaizens
    users_for_skill_gap = []
    for i in range(100):
        emp_id = f"EMP_GAP_SKILL_{random.randint(10000, 99999)}"
        users_for_skill_gap.append({
            "id": emp_id,
            "name": f"Skill Gap User {i}",
            "organization_id": company_id,
            "role": "employee",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=90)).isoformat(),
            "updated_at": (datetime.now(timezone.utc) - timedelta(days=90)).isoformat()
        })
    try:
        await db.users.insert_many(users_for_skill_gap)
        emp_ids = [u["id"] for u in users_for_skill_gap]
        await db.iatf_skill_matrix.delete_many({"employee_id": {"$in": emp_ids}})
    except Exception as e:
        pass # Ignore if it fails due to some db constraints, but this is mongo so should be fine

    kaizens_gap = []
    old_date = (datetime.now(timezone.utc) - timedelta(days=25)).isoformat()
    for i in range(100):
        kaizens_gap.append({
            "id": str(uuid.uuid4()),
            "employee_id": random.choice(users_for_skill_gap)["id"] if users_for_skill_gap else "emp_1",
            "metadata": {
                "version": "1.0",
                "created_by": hr_id,
                "company_id": company_id,
                "status": "active",
                "created_at": old_date,
                "updated_at": old_date
            },
            "theme": "Process Improvement",
            "problem_description": "Legacy process delay",
            "suggestion_details": "Automate tracking",
            "status": "pending",
            "savings_estimated": 500,
            "impact_area": "Time Saving"
        })
    try:
        await db.iatf_kaizen_suggestion.insert_many(kaizens_gap)
    except Exception:
        pass

    new_hires = []
    new_hire_date = (datetime.now(timezone.utc) - timedelta(days=10)).isoformat()
    for i in range(50):
        emp_id = f"EMP_GAP_IND_{random.randint(10000, 99999)}"
        new_hires.append({
            "id": emp_id,
            "name": f"New Hire {i}",
            "organization_id": company_id,
            "role": "employee",
            "created_at": new_hire_date,
            "updated_at": new_hire_date
        })
    try:
        await db.users.insert_many(new_hires)
        new_hire_ids = [u["id"] for u in new_hires]
        await db.iatf_induction_program.delete_many({"employee_id": {"$in": new_hire_ids}})
    except Exception:
        pass
    print("DONE: Seeded 250 additional records for Gap Analysis (Audit Dashboard)")

    print("\nSUCCESS: VOLUME SEEDING COMPLETED!")

    client.close()

if __name__ == "__main__":
    asyncio.run(seed_iatf_data())
