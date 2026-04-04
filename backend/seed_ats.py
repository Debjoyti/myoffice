import json
import random
import uuid
import os
import asyncio
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorClient

# Configuration
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'myoffice')

NUM_JOBS = 110
NUM_CANDIDATES = 320
NUM_APPLICATIONS = 550

DEPT_LOCATIONS = {
    "Engineering": ["New York", "San Francisco", "Bangalore", "Remote"],
    "Sales": ["London", "Dubai", "Singapore", "Mumbai"],
    "Marketing": ["Berlin", "London", "Austin"],
    "HR": ["New York", "Bangalore"],
    "Finance": ["Singapore", "Frankfurt"]
}

JOB_TITLES = [
    "Senior Software Engineer", "Product Manager", "UI/UX Designer", "DevOps Specialist",
    "Sales Executive", "Marketing Manager", "HR Specialist", "Accountant",
    "Technical Lead", "QA Automation Engineer", "Backend Developer (Go)", "Frontend Engineer (React)"
]

CANDIDATE_SKILLS = ["Python", "React", "Node.js", "SQL", "Cloud Architecture", "Project Management", "Digital Marketing", "SEO", "AWS"]

FIRST_NAMES = ["Liam", "Olivia", "Noah", "Emma", "Oliver", "Ava", "Elijah", "Charlotte", "William", "Sophia", "James", "Amelia", "Benjamin", "Isabella", "Lucas", "Mia"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Wilson", "Anderson", "Thomas", "Taylor"]

JOB_STATUSES = ["open", "open", "open", "closed", "draft"]
APP_STATUSES = ["applied", "screening", "interview", "offered", "rejected"]
INTERVIEW_ROUNDS = ["HR", "Technical", "Managerial"]
INTERVIEW_STATUSES = ["scheduled", "completed", "failed"]

async def seed_ats():
    print("🎯 ATS SEEDING: Senior Backend Architect Mode")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Get Primary Org
    user = await db.users.find_one({"role": "admin"}) or await db.users.find_one({})
    ORG_ID = user.get('organization_id', 'default') if user else 'default'

    # Clear old data
    await db.jobs.delete_many({"organization_id": ORG_ID})
    await db.candidates.delete_many({"organization_id": ORG_ID})
    await db.recruitment_recruiters.delete_many({})
    await db.recruitment_applications.delete_many({})
    await db.recruitment_interviews.delete_many({})

    # 1. Recruiters
    recruiters = []
    for i in range(12):
        recruiters.append({
            "id": f"REC-{str(uuid.uuid4())[:8].upper()}",
            "name": f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
            "email": f"recruiter{i}@prsk.com",
            "role": "Lead Recruiter" if i == 0 else "Talent Associate"
        })
    if recruiters: await db.recruitment_recruiters.insert_many(recruiters)

    # 2. Jobs
    jobs = []
    for i in range(NUM_JOBS):
        dept = random.choice(list(DEPT_LOCATIONS.keys()))
        loc = random.choice(DEPT_LOCATIONS[dept])
        title = f"{random.choice(JOB_TITLES)}"
        jobs.append({
            "id": f"JOB-{1000 + i}",
            "title": title,
            "department": dept,
            "location": loc,
            "type": random.choice(["Full-time", "Contract", "Remote"]),
            "description": f"Hiring {title} for {dept} team.",
            "status": random.choice(JOB_STATUSES),
            "organization_id": ORG_ID,
            "created_at": (datetime.now() - timedelta(days=random.randint(1, 90))).isoformat()
        })
    if jobs: await db.jobs.insert_many(jobs)
    open_job_ids = [j["id"] for j in jobs if j["status"] == "open"]

    # 3. Candidates (Person Master)
    candidates_master = []
    for i in range(NUM_CANDIDATES):
        fn, ln = random.choice(FIRST_NAMES), random.choice(LAST_NAMES)
        candidates_master.append({
            "id": str(uuid.uuid4()),
            "name": f"{fn} {ln}",
            "email": f"{fn.lower()}.{ln.lower()}.{i}@example.com",
            "phone": f"+{random.randint(1, 99)} {random.randint(700000000, 999999999)}",
            "skills": random.sample(CANDIDATE_SKILLS, random.randint(2, 4)),
            "organization_id": ORG_ID,
            "created_at": (datetime.now() - timedelta(days=random.randint(30, 120))).isoformat()
        })
    # Note: We won't insert this into 'candidates' directly as 'candidates' in current system is 'applications'.

    # 4. Applications (Candidate table in existing system)
    legacy_candidates = [] # This maps to the frontend dashboard
    new_apps = [] # This is for future scalable ATS
    used_mappings = set()
    
    for i in range(NUM_APPLICATIONS):
        cand = random.choice(candidates_master)
        job = random.choice(jobs)
        
        if (cand["id"], job["id"]) in used_mappings: continue
        used_mappings.add((cand["id"], job["id"]))

        app_status = random.choice(APP_STATUSES)
        app_id = f"APP-{str(uuid.uuid4())[:12].upper()}"
        
        # Add to legacy candidates (for current dashboard compatibility)
        legacy_candidates.append({
            "id": app_id,
            "job_id": job["id"],
            "name": cand["name"],
            "email": cand["email"],
            "status": app_status,
            "organization_id": ORG_ID,
            "created_at": (datetime.now() - timedelta(days=random.randint(0, 60))).isoformat()
        })

        # Add to new Applications collection
        new_apps.append({
            "id": app_id,
            "candidate_id": cand["id"],
            "job_id": job["id"],
            "status": app_status,
            "organization_id": ORG_ID,
            "applied_at": legacy_candidates[-1]["created_at"]
        })

    if legacy_candidates: await db.candidates.insert_many(legacy_candidates)
    if new_apps: await db.recruitment_applications.insert_many(new_apps)

    # 5. Interviews
    interviews = []
    for app in [a for a in new_apps if a["status"] in ["interview", "offered"]]:
        interviews.append({
            "id": f"INT-{str(uuid.uuid4())[:8].upper()}",
            "application_id": app["id"],
            "round": random.choice(INTERVIEW_ROUNDS),
            "status": random.choice(INTERVIEW_STATUSES),
            "interview_date": (datetime.now() + timedelta(days=random.randint(-10, 10))).isoformat(),
            "organization_id": ORG_ID
        })
    if interviews: await db.recruitment_interviews.insert_many(interviews)

    # Generate JSON file for deliverable
    def clean_ids(lst):
        for item in lst:
            item.pop('_id', None)
        return lst

    json_data = {
        "recruiters": clean_ids(recruiters),
        "jobs": clean_ids(jobs),
        "candidates": clean_ids(candidates_master),
        "applications": clean_ids(new_apps),
        "interviews": clean_ids(interviews)
    }
    with open("backend/ats_seed_data.json", "w") as f:
        json.dump(json_data, f, indent=2)

    print(f"🚀 SEEDING COMPLETE: 110 Jobs, 320 Master Candidates, {len(legacy_candidates)} Applications.")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_ats())
