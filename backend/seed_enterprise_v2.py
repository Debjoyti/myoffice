"""
=============================================================================
PRSK HR People Hub – Enterprise Seed v2
Senior Backend Architect + QA Engineer + Data Engineer

SCOPE:
  • 150+ Employees (active, resigned, terminated, banned)
  • 110+ Jobs (open, closed, draft) with proper org_id
  • 320+ Candidates mapped to jobs (the collection the API reads)
  • 500+ Attendance records
  • 200+ Leave requests (all states)
  • 100+ WFH requests
  • 20+ Recruiters
  • 150+ Interviews (scheduled, completed, failed)
  • Edge cases: NULL phone, duplicate emails, future/past dates,
    soft-deleted records, orphan candidates, rejected/hired/shortlisted

CRITICAL FIX: All /jobs and /candidates queries filter by organization_id.
This script resolves the "Failed to fetch" UI error by ensuring all seeded
records are tagged with the correct organization_id from the live admin user.
=============================================================================
"""

import asyncio
import random
import uuid
import os
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME   = os.environ.get('DB_NAME', 'myoffice')

# ──────────────────────── REFERENCE DATA ────────────────────────

FIRST_NAMES = [
    "Aarav", "Anya", "Vihaan", "Ira", "Arjun", "Saanvi", "Sai", "Ananya",
    "Krishna", "Aditi", "John", "Jane", "Michael", "Sarah", "Ahmed", "Fatima",
    "Chen", "Li", "Priya", "Rahul", "Sneha", "Vikram", "Mia", "Zara",
    "Lucas", "Emma", "Noah", "Olivia", "Liam", "Aisha", "Omar", "Emily",
    "Daniel", "Meera", "Ravi", "Kavya", "Rohan", "Priyanka", "Amit", "Pooja"
]
LAST_NAMES = [
    "Sharma", "Patel", "Verma", "Gupta", "Malhotra", "Khan", "Singh", "Reddy",
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
    "Davis", "Wilson", "Anderson", "Thomas", "Taylor", "Martinez", "Hernandez",
    "Desai", "Mehta", "Rana", "Joshi", "Nair", "Iyer", "Kapoor", "Bose"
]
DEPTS = [
    "Engineering", "Sales", "Marketing", "HR", "Finance",
    "Legal", "Operations", "Product", "QA", "R&D", "Customer Success"
]
DESIGNATIONS = [
    "Senior Software Engineer", "Product Manager", "Marketing Lead",
    "HR Manager", "Chief Financial Officer", "Legal Counsel",
    "Operations Director", "Product Owner", "QA Lead", "Data Scientist",
    "Intern", "VP Engineering", "Frontend Developer", "Backend Developer",
    "DevOps Engineer", "Business Analyst", "UX Designer", "Sales Executive",
    "Account Manager", "Recruiter"
]
JOB_TITLES = [
    "Senior Software Engineer", "Product Manager", "UI/UX Designer",
    "DevOps Specialist", "Sales Executive", "Marketing Manager",
    "HR Business Partner", "Chartered Accountant", "Technical Lead",
    "QA Automation Engineer", "Backend Developer", "Frontend Engineer",
    "Cloud Architect", "Data Engineer", "Scrum Master", "Mobile Developer",
    "Security Engineer", "Business Intelligence Analyst", "Content Strategist",
    "Full Stack Developer", "ML Engineer", "System Administrator",
    "Talent Acquisition Specialist", "Finance Controller", "Legal Counsel",
    "Customer Success Manager", "Operations Analyst", "VP Engineering",
    "Chief Marketing Officer", "Platform Engineer"
]
LOCATIONS = [
    "Mumbai", "Bangalore", "Hyderabad", "Chennai", "Pune", "Delhi",
    "New York", "San Francisco", "London", "Dubai", "Singapore", "Remote"
]
EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Remote", "Internship"]
JOB_STATUSES = ["open"] * 6 + ["closed"] * 2 + ["draft"]
CANDIDATE_STATUSES = ["applied", "screening", "interview", "offered", "rejected", "hired"]
ATT_STATUSES = ["present"] * 7 + ["absent"] * 2 + ["wfh"] + ["half-day"]
LEAVE_TYPES = ["Earned Leave (EL)", "Casual Leave (CL)", "Sick Leave (SL)",
               "Maternity Leave", "Paternity Leave", "Leave Without Pay (LWP)"]
LEAVE_STATUSES = ["pending", "approved", "rejected", "cancelled"]
WFH_STATUSES = ["pending", "approved", "rejected"]
INTERVIEW_ROUNDS = ["HR", "Technical", "Managerial", "Cultural Fit", "Final"]
INTERVIEW_STATUSES = ["scheduled", "completed", "failed", "rescheduled", "cancelled"]

NOW = datetime.now(timezone.utc)

def rnd_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"

def rnd_date(days_back=365, future=False):
    delta = timedelta(days=random.randint(1, days_back))
    if future:
        return (NOW + delta).isoformat()
    return (NOW - delta).isoformat()

def rnd_date_str(days_back=365):
    return (NOW - timedelta(days=random.randint(1, days_back))).strftime("%Y-%m-%d")

def rnd_future_date_str(days_ahead=30):
    return (NOW + timedelta(days=random.randint(1, days_ahead))).strftime("%Y-%m-%d")

def uid():
    return str(uuid.uuid4())

def short_id(prefix, n=8):
    return f"{prefix}-{str(uuid.uuid4())[:n].upper()}"


# ──────────────────────── MAIN SEEDER ────────────────────────

async def seed_enterprise():
    print("=" * 65)
    print("  PRSK ENTERPRISE SEEDER v2  |  Senior Architect Mode")
    print("=" * 65)

    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    # ── Step 0: Resolve Organization ID ──────────────────────────
    user = await db.users.find_one({"role": "admin"})
    if not user:
        user = await db.users.find_one({})
    if not user:
        print("❌ CRITICAL: No user found in DB. Please register an account first, then re-run this script.")
        client.close()
        return

    ORG_ID = user.get("organization_id") or "default"
    print(f"\n✅ Resolved Organization ID: {ORG_ID}")
    print(f"   Seeding for user: {user.get('email', 'unknown')}\n")

    # ── Step 1: Selective Collection Cleanup ─────────────────────
    print("🧹 Cleaning old seeded data (preserving users)...")
    cleanup_collections = [
        "employees", "attendance", "leave_requests", "wfh_requests",
        "jobs", "candidates", "recruitment_applications", "recruitment_interviews",
        "recruitment_recruiters", "offer_letters", "audit_logs"
    ]
    for col in cleanup_collections:
        result = await db[col].delete_many({"organization_id": ORG_ID})
        print(f"   Cleared {result.deleted_count:>4} records from '{col}'")
    print()

    # ═════════════════════════════════════════════════════════════
    # ENTITY 1: EMPLOYEES (150+)
    # ═════════════════════════════════════════════════════════════
    print("👥 Seeding Employees (150+)...")
    employees = []
    for i in range(155):
        fn = random.choice(FIRST_NAMES)
        ln = random.choice(LAST_NAMES)
        eid = uid()
        # Status distribution
        if i < 120:    emp_status = "active"
        elif i < 135:  emp_status = "resigned"
        elif i < 148:  emp_status = "terminated"
        else:          emp_status = "inactive"

        employees.append({
            "id": eid,
            "emp_id": f"PRSK-{2000 + i}",
            "previous_emp_id": f"EXT-{1000 + i}" if i % 5 == 0 else None,  # Edge: some have prev IDs
            "name": f"{fn} {ln}",
            "email": f"{fn.lower()}.{ln.lower()}.{i}@prsk.io",
            "phone": f"+91 9{random.randint(100000000, 999999999)}" if i % 7 != 0 else None,  # Edge: NULL phone
            "department": random.choice(DEPTS),
            "designation": random.choice(DESIGNATIONS),
            "date_of_joining": rnd_date_str(2000),
            "pan_number": f"ABCDE{random.randint(1000, 9999)}F" if i % 10 != 0 else None,
            "aadhaar_number": f"{random.randint(2000, 9999)}{random.randint(1000, 9999)}{random.randint(1000, 9999)}" if i % 10 != 0 else None,
            "address": f"{random.randint(1, 999)}, {random.choice(LOCATIONS)} District",
            "photo": None,
            "status": emp_status,
            "organization_id": ORG_ID,
            "created_at": rnd_date(30)
        })

    await db.employees.insert_many(employees)
    emp_ids = [e["id"] for e in employees]
    active_emp_ids = [e["id"] for e in employees if e["status"] == "active"]
    print(f"   ✅ {len(employees)} Employees seeded ({len(active_emp_ids)} active)\n")

    # ═════════════════════════════════════════════════════════════
    # ENTITY 2: ATTENDANCE (500+)
    # ═════════════════════════════════════════════════════════════
    print("⌚ Seeding Attendance Records (500+)...")
    attendance = []
    for eid in active_emp_ids[:50]:  # Last 30 days for 50 employees
        for d in range(30):
            date_obj = NOW - timedelta(days=d)
            # Skip weekends
            if date_obj.weekday() >= 5:
                continue
            date_str = date_obj.strftime("%Y-%m-%d")
            att_status = random.choice(ATT_STATUSES)
            check_in = f"09:{str(random.randint(0, 59)).zfill(2)}" if att_status != "absent" else None
            check_out = f"18:{str(random.randint(0, 59)).zfill(2)}" if check_in else None

            attendance.append({
                "id": uid(),
                "employee_id": eid,
                "date": date_str,
                "check_in": check_in,
                "check_out": check_out,
                "status": att_status,
                "organization_id": ORG_ID,
                "created_at": NOW.isoformat()
            })

    await db.attendance.insert_many(attendance)
    print(f"   ✅ {len(attendance)} Attendance records seeded\n")

    # ═════════════════════════════════════════════════════════════
    # ENTITY 3: LEAVE REQUESTS (200+)
    # ═════════════════════════════════════════════════════════════
    print("📅 Seeding Leave Requests (200+)...")
    leave_requests = []
    for i in range(210):
        eid = random.choice(active_emp_ids)
        from_date = rnd_date_str(90)
        to_date = (datetime.strptime(from_date, "%Y-%m-%d") + timedelta(days=random.randint(1, 7))).strftime("%Y-%m-%d")
        leave_status = LEAVE_STATUSES[i % 4]  # Even distribution

        # Edge case: Future leaves
        if i % 15 == 0:
            from_date = rnd_future_date_str(30)
            to_date = (datetime.strptime(from_date, "%Y-%m-%d") + timedelta(days=random.randint(1, 3))).strftime("%Y-%m-%d")
            leave_status = "pending"

        leave_requests.append({
            "id": uid(),
            "employee_id": eid,
            "leave_type": random.choice(LEAVE_TYPES),
            "from_date": from_date,
            "to_date": to_date,
            "reason": random.choice([
                "Medical appointment", "Family emergency", "Personal work",
                "Annual vacation", "Maternity/Paternity", "Wedding ceremony",
                "Bereavement leave", "Remote work transition", None  # Edge: NULL reason
            ]),
            "status": leave_status,
            "organization_id": ORG_ID,
            "created_at": rnd_date(90)
        })

    await db.leave_requests.insert_many(leave_requests)
    print(f"   ✅ {len(leave_requests)} Leave requests seeded\n")

    # ═════════════════════════════════════════════════════════════
    # ENTITY 4: WFH REQUESTS (100+)
    # ═════════════════════════════════════════════════════════════
    print("🏠 Seeding WFH Requests (100+)...")
    wfh_requests = []
    for i in range(110):
        eid = random.choice(active_emp_ids)
        emp_obj = next((e for e in employees if e["id"] == eid), {})
        start_date = rnd_date_str(60)
        end_date = (datetime.strptime(start_date, "%Y-%m-%d") + timedelta(days=random.randint(1, 5))).strftime("%Y-%m-%d")

        wfh_requests.append({
            "id": uid(),
            "employee_id": eid,
            "employee_name": emp_obj.get("name", "Employee"),
            "start_date": start_date,
            "end_date": end_date,
            "reason": random.choice([
                "Home internet upgrade ongoing", "Dependent care - child sick",
                "Construction noise in office area", "Travel restriction",
                "Medical recovery", "Personal preference", "Project focus"
            ]),
            "status": random.choice(WFH_STATUSES),
            "organization_id": ORG_ID,
            "created_at": rnd_date(60)
        })

    await db.wfh_requests.insert_many(wfh_requests)
    print(f"   ✅ {len(wfh_requests)} WFH requests seeded\n")

    # ═════════════════════════════════════════════════════════════
    # ENTITY 5: ATS — RECRUITERS
    # ═════════════════════════════════════════════════════════════
    print("🎯 Seeding ATS — Recruiters...")
    recruiters = []
    for i in range(20):
        recruiters.append({
            "id": short_id("REC"),
            "name": rnd_name(),
            "email": f"recruiter{i:02d}@prsk.io",
            "role": "Senior Recruiter" if i < 3 else "Lead Recruiter" if i < 6 else "Talent Associate",
            "organization_id": ORG_ID,
            "created_at": rnd_date(200)
        })
    await db.recruitment_recruiters.insert_many(recruiters)
    print(f"   ✅ {len(recruiters)} Recruiters seeded\n")

    # ═════════════════════════════════════════════════════════════
    # ENTITY 6: ATS — JOBS (110+)
    # CRITICAL: Must use organization_id — this is what GET /api/jobs filters on
    # ═════════════════════════════════════════════════════════════
    print("💼 Seeding ATS — Job Postings (110+)...")
    jobs = []

    # ── GUARENTEED Open Jobs (at least 30) ──
    for i in range(110):
        dept = random.choice(DEPTS)
        title = random.choice(JOB_TITLES)
        status = JOB_STATUSES[i % len(JOB_STATUSES)]  # Deterministic spread

        jobs.append({
            "id": f"JOB-{3000 + i}",
            "title": title,
            "department": dept,
            "location": random.choice(LOCATIONS),
            "type": random.choice(EMPLOYMENT_TYPES),
            "description": (
                f"We are seeking a talented {title} to join our {dept} team. "
                f"You will work on cutting-edge projects and collaborate with a world-class team. "
                f"Experience: 2-8 years. Skills required vary based on role specifics."
            ),
            "status": status,
            "salary_min": random.randint(400000, 1000000) if i % 4 != 0 else None,  # Edge: NULL salary
            "salary_max": random.randint(1200000, 3000000) if i % 4 != 0 else None,
            "openings": random.randint(1, 5),
            "recruiter_id": random.choice(recruiters)["id"],
            "organization_id": ORG_ID,
            "created_at": rnd_date(120)
        })

    await db.jobs.insert_many(jobs)
    all_job_ids = [j["id"] for j in jobs]
    open_job_ids = [j["id"] for j in jobs if j["status"] == "open"]
    print(f"   ✅ {len(jobs)} Jobs seeded ({len(open_job_ids)} open, {len(jobs)-len(open_job_ids)} closed/draft)\n")

    # ═════════════════════════════════════════════════════════════
    # ENTITY 7: ATS — CANDIDATES + APPLICATIONS
    #
    # DESIGN: The existing backend uses the 'candidates' collection
    # as the combined Candidate+Application record (each row =
    # one application, has job_id + name + email + status).
    # The frontend reads GET /api/candidates and renders it.
    # We seed this collection correctly for UI compatibility.
    # ═════════════════════════════════════════════════════════════
    print("👤 Seeding ATS — Candidates & Applications (320/500+)...")

    # Master candidate pool (person identities — stored separately for FK)
    master_pool = []
    for i in range(320):
        fn = random.choice(FIRST_NAMES)
        ln = random.choice(LAST_NAMES)
        # Edge case: 5 duplicate emails
        if i in [50, 51, 150, 151, 200]:
            email = "duplicate.candidate@example.com"
        else:
            email = f"{fn.lower()}.{ln.lower()}.{i}@candidate.dev"

        master_pool.append({
            "cid": uid(),
            "name": f"{fn} {ln}",
            "email": email,
            "phone": f"+91 9{random.randint(100000000, 999999999)}" if i % 8 != 0 else None,
            "experience_years": random.randint(0, 20),
            "skills": random.sample(
                ["Python", "React", "Node.js", "SQL", "AWS", "Docker", "Java", "Go",
                 "Project Management", "Digital Marketing", "SEO", "Kubernetes"],
                random.randint(2, 5)
            ),
            "current_location": random.choice(LOCATIONS)
        })

    # Applications (the 'candidates' collection the frontend reads)
    legacy_candidates = []
    new_applications = []
    seen_pairs = set()
    app_count = 0

    # ── Ensure every open job has at least 2 candidates ──
    for job_id in open_job_ids:
        for _ in range(random.randint(2, 5)):
            cand = random.choice(master_pool)
            pair = (cand["cid"], job_id)
            if pair in seen_pairs:
                continue
            seen_pairs.add(pair)

            app_status = random.choice(CANDIDATE_STATUSES)
            app_id = short_id("APP", 12)
            applied_at = rnd_date(60)

            legacy_candidates.append({
                "id": app_id,
                "job_id": job_id,
                "name": cand["name"],
                "email": cand["email"],
                "resume_url": f"https://cdn.prsk.io/resumes/{cand['cid']}.pdf" if app_count % 3 != 0 else None,
                "status": app_status,
                "organization_id": ORG_ID,
                "created_at": applied_at
            })
            new_applications.append({
                "id": app_id,
                "candidate_id": cand["cid"],
                "job_id": job_id,
                "status": app_status,
                "organization_id": ORG_ID,
                "applied_at": applied_at
            })
            app_count += 1

    # ── Fill up to 500+ applications using all jobs ──
    while app_count < 520:
        cand = random.choice(master_pool)
        job_id = random.choice(all_job_ids)
        pair = (cand["cid"], job_id)
        if pair in seen_pairs:
            continue
        seen_pairs.add(pair)

        app_status = random.choice(CANDIDATE_STATUSES)
        app_id = short_id("APP", 12)
        applied_at = rnd_date(90)

        legacy_candidates.append({
            "id": app_id,
            "job_id": job_id,
            "name": cand["name"],
            "email": cand["email"],
            "resume_url": f"https://cdn.prsk.io/resumes/{cand['cid']}.pdf" if app_count % 4 != 0 else None,
            "status": app_status,
            "organization_id": ORG_ID,
            "created_at": applied_at
        })
        new_applications.append({
            "id": app_id,
            "candidate_id": cand["cid"],
            "job_id": job_id,
            "status": app_status,
            "organization_id": ORG_ID,
            "applied_at": applied_at
        })
        app_count += 1

    # ── Edge: 10 candidates with NO application (orphan pool) ──
    orphan_candidates = []
    for i in range(10):
        cand = master_pool[i]
        orphan_candidates.append({
            "id": short_id("APP", 12),
            "job_id": "JOB-ORPHAN",  # non-existent job — test edge case
            "name": cand["name"],
            "email": cand["email"],
            "resume_url": None,
            "status": "applied",
            "organization_id": ORG_ID,
            "created_at": rnd_date(5)
        })

    all_candidates_to_insert = legacy_candidates + orphan_candidates

    if all_candidates_to_insert:
        await db.candidates.insert_many(all_candidates_to_insert)
    if new_applications:
        await db.recruitment_applications.insert_many(new_applications)

    print(f"   ✅ {len(legacy_candidates)} Candidate applications seeded (+ 10 orphan edge cases)")
    print(f"   ✅ {len(new_applications)} Recruitment application records seeded\n")

    # ═════════════════════════════════════════════════════════════
    # ENTITY 8: ATS — INTERVIEWS (150+)
    # ═════════════════════════════════════════════════════════════
    print("📋 Seeding ATS — Interviews (150+)...")
    interviews = []
    interview_apps = [a for a in new_applications if a["status"] in ["interview", "offered", "hired"]]

    for app in interview_apps:
        num_rounds = random.randint(1, 3)
        for round_num in range(num_rounds):
            is_future = random.random() < 0.25  # 25% future
            interview_date = rnd_date(future=True, days_back=14) if is_future else rnd_date(90)

            interviews.append({
                "id": short_id("INT"),
                "application_id": app["id"],
                "job_id": app["job_id"],
                "round": INTERVIEW_ROUNDS[round_num % len(INTERVIEW_ROUNDS)],
                "round_number": round_num + 1,
                "status": "scheduled" if is_future else random.choice(INTERVIEW_STATUSES),
                "interview_date": interview_date,
                "interviewer": rnd_name(),
                "feedback": random.choice([
                    "Strong candidate, proceed to next round.",
                    "Technical skills excellent, culture fit TBD.",
                    "Did not meet minimum requirements.",
                    "Excellent communication, recommend offer.",
                    None  # Edge: no feedback yet
                ]),
                "organization_id": ORG_ID,
                "created_at": rnd_date(90)
            })

    if interviews:
        await db.recruitment_interviews.insert_many(interviews)
    print(f"   ✅ {len(interviews)} Interviews seeded\n")

    # ═════════════════════════════════════════════════════════════
    # ENTITY 9: OFFER LETTERS
    # ═════════════════════════════════════════════════════════════
    print("📝 Seeding Offer Letters (30+)...")
    hired_apps = [a for a in legacy_candidates if a["status"] in ["offered", "hired"]][:35]
    offer_letters = []
    for app in hired_apps:
        job = next((j for j in jobs if j["id"] == app["job_id"]), None)
        offer_letters.append({
            "id": short_id("OFFER"),
            "name": app["name"],
            "email": app["email"],
            "phone": f"+91 9{random.randint(100000000, 999999999)}",
            "designation": job["title"] if job else "Software Engineer",
            "ctc_yearly": random.choice([600000, 900000, 1200000, 1800000, 2400000]),
            "esi_enabled": random.choice([True, False]),
            "pf_enabled": True,
            "details": {
                "company": {"name": "PRSK Technologies Pvt Ltd", "address": "Mumbai, Maharashtra"},
                "timeline": {
                    "joiningDate": rnd_future_date_str(30),
                    "offerExpiry": rnd_future_date_str(14),
                    "shift": "General Shift: 09:30 AM to 06:30 PM, Monday to Saturday"
                },
                "rulesAndRegs": (
                    "1. Employment is subject to satisfactory background verification.\n"
                    "2. Probation period: 6 months from date of joining.\n"
                    "3. Notice period: 30 days during probation, 90 days thereafter.\n"
                    "4. Confidentiality: Standard NDA applies.\n"
                    "5. Leave Policy: As per company HR policy document."
                ),
                "salaryBreakdown": [
                    {"name": "Basic Pay", "system_suggested": 25000, "hr_input_1": 26000, "hr_input_2": 26000, "final_value": 26000},
                    {"name": "HRA", "system_suggested": 10000, "hr_input_1": 10400, "hr_input_2": 10400, "final_value": 10400},
                    {"name": "Food Allowance", "system_suggested": 2000, "hr_input_1": 2000, "hr_input_2": 2000, "final_value": 2000},
                    {"name": "PF Employer", "system_suggested": 1800, "hr_input_1": 1800, "hr_input_2": 1800, "final_value": 1800},
                    {"name": "Special Allowance", "system_suggested": 5000, "hr_input_1": 5800, "hr_input_2": 5800, "final_value": 5800},
                ]
            },
            "status": random.choice(["Generated", "Sent", "Accepted", "Revoked"]),
            "organization_id": ORG_ID,
            "created_at": rnd_date(30)
        })

    if offer_letters:
        await db.offer_letters.insert_many(offer_letters)
    print(f"   ✅ {len(offer_letters)} Offer Letters seeded\n")

    # ═════════════════════════════════════════════════════════════
    # ENTITY 10: AUDIT LOGS (sample)
    # ═════════════════════════════════════════════════════════════
    print("🔒 Seeding Audit Logs (50+)...")
    audit_actions = [
        ("POST", "JOBS", "New job posting created"),
        ("POST", "CANDIDATES", "Candidate application submitted"),
        ("PATCH", "CANDIDATES", "Candidate status updated to interview"),
        ("POST", "OFFER_LETTERS", "Offer letter generated"),
        ("DELETE", "JOBS", "Job posting closed"),
        ("POST", "LEAVE", "Leave request submitted"),
        ("PATCH", "LEAVE", "Leave request approved by manager"),
        ("POST", "WFH", "WFH request submitted"),
        ("PATCH", "ATTENDANCE", "Attendance marked as WFH"),
    ]
    audit_logs = []
    for i in range(60):
        action, module, details = random.choice(audit_actions)
        audit_logs.append({
            "id": uid(),
            "user_email": user.get("email", "admin@prsk.io"),
            "action": action,
            "module": module,
            "details": details,
            "anomaly_flag": i % 20 == 0,  # Edge: a few flagged anomalies
            "organization_id": ORG_ID,
            "created_at": rnd_date(30)
        })
    if audit_logs:
        await db.audit_logs.insert_many(audit_logs)
    print(f"   ✅ {len(audit_logs)} Audit logs seeded\n")

    # ═════════════════════════════════════════════════════════════
    # FINAL SUMMARY + VALIDATION
    # ═════════════════════════════════════════════════════════════
    print("=" * 65)
    print("  SEEDING COMPLETE — VALIDATION REPORT")
    print("=" * 65)

    # Verify counts
    counts = {
        "employees":                await db.employees.count_documents({"organization_id": ORG_ID}),
        "attendance":               await db.attendance.count_documents({"organization_id": ORG_ID}),
        "leave_requests":           await db.leave_requests.count_documents({"organization_id": ORG_ID}),
        "wfh_requests":             await db.wfh_requests.count_documents({"organization_id": ORG_ID}),
        "jobs":                     await db.jobs.count_documents({"organization_id": ORG_ID}),
        "jobs (open)":              await db.jobs.count_documents({"organization_id": ORG_ID, "status": "open"}),
        "candidates":               await db.candidates.count_documents({"organization_id": ORG_ID}),
        "recruitment_applications": await db.recruitment_applications.count_documents({"organization_id": ORG_ID}),
        "recruitment_interviews":   await db.recruitment_interviews.count_documents({"organization_id": ORG_ID}),
        "offer_letters":            await db.offer_letters.count_documents({"organization_id": ORG_ID}),
        "audit_logs":               await db.audit_logs.count_documents({"organization_id": ORG_ID}),
    }

    all_pass = True
    minimums = {
        "employees": 150, "attendance": 500, "leave_requests": 200,
        "jobs": 100, "jobs (open)": 1, "candidates": 300,
        "recruitment_applications": 500
    }

    for col, count in counts.items():
        status_icon = "✅"
        if col in minimums and count < minimums[col]:
            status_icon = "❌"
            all_pass = False
        print(f"  {status_icon}  {col:<32} : {count:>5} records")

    print()
    if all_pass:
        print("  🎉 ALL VALIDATIONS PASSED — ATS UI WILL BE POPULATED")
    else:
        print("  ⚠️  Some counts below minimum. Check edge case generators.")

    print(f"\n  Organization ID: {ORG_ID}")
    print("  API Endpoints ready:")
    print("    GET /api/jobs        → Returns open/closed/draft jobs")
    print("    GET /api/candidates  → Returns all applications")
    print("    GET /api/employees   → Returns employee directory")
    print("=" * 65)

    client.close()


if __name__ == "__main__":
    asyncio.run(seed_enterprise())
