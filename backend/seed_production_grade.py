import asyncio
import random
import uuid
import os
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorClient

# Configuration
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'myoffice')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# ────────────── DATA GENERATORS ──────────────

FIRST_NAMES = ["Aarav", "Anya", "Vihaan", "Ira", "Arjun", "Saanvi", "Sai", "Ananya", "Krishna", "Aditi", "John", "Jane", "Michael", "Sarah", "Ahmed", "Fatima", "Chen", "Li"]
LAST_NAMES = ["Sharma", "Patel", "Verma", "Gupta", "Malhotra", "Khan", "Singh", "Reddy", "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis"]
DEPTS = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Legal", "Operations", "Product", "QA", "R&D"]
DESIGNATIONS = ["Senior Engineer", "VP Sales", "Marketing Associate", "HR Manager", "CFO", "General Counsel", "Ops Director", "Product Owner", "QA Lead", "Scientist", "Intern"]
CITIES = ["Mumbai", "New York", "London", "Tokyo", "Dubai", "Singapore", "Berlin", "San Francisco", "Bangalore"]
COMPANIES = ["TechNova Solutions", "Global Genesis", "Infinite Loop Inc", "Quantum Dynamics", "Stellar Ventures", "Prime Logistics", "Vertex Systems"]
LEAD_SOURCES = ["LinkedIn", "Website Inquiry", "Referral", "Cold Call", "Webinar", "Partner"]
INVOICE_STATUSES = ["paid", "pending", "overdue", "draft", "cancelled"]
LEAD_STATUSES = ["new", "contacted", "qualified", "lost"]
DEAL_STAGES = ["discovery", "proposal", "negotiation", "closed_won", "closed_lost"]

def get_now(): return datetime.now(timezone.utc)

def random_date(days_back=365):
    return (get_now() - timedelta(days=random.randint(0, days_back))).isoformat()

def random_date_str(days_back=365):
    return (get_now() - timedelta(days=random.randint(0, days_back))).strftime("%Y-%m-%d")

async def seed_all():
    print("🚀 INITIALIZING PRODUCTION-GRADE DATA SEEDING...")
    
    # 1. Clear existing data (optional, but requested for "Complete" dataset)
    collections = await db.list_collection_names()
    for c in collections:
        if c != "users": await db[c].delete_many({})
    
    # Get Primary Org
    user = await db.users.find_one({"role": "admin"}) or await db.users.find_one({})
    if not user:
        print("❌ No admin user found. Please register first.")
        return
    ORG_ID = user.get('organization_id', 'org-prod-001')

    # ────────────── ENTITY: EMPLOYEES (100+) ──────────────
    print("👥 Seeding Employees...")
    employees = []
    for i in range(120):
        fn, ln = random.choice(FIRST_NAMES), random.choice(LAST_NAMES)
        eid = str(uuid.uuid4())
        employees.append({
            "id": eid,
            "emp_id": f"PRSK-{1000 + i}",
            "name": f"{fn} {ln}",
            "email": f"{fn.lower()}.{ln.lower()}.{i}@example.com",
            "phone": f"+{random.randint(1, 99)} {random.randint(700000000, 999999999)}",
            "department": random.choice(DEPTS),
            "designation": random.choice(DESIGNATIONS),
            "date_of_joining": random_date_str(2000),
            "pan_number": f"ABCDE{random.randint(1000, 9999)}F",
            "status": "active" if i < 110 else "resigned" if i < 115 else "terminated",
            "organization_id": ORG_ID,
            "created_at": random_date(30)
        })
    await db.employees.insert_many(employees)
    emp_ids = [e['id'] for e in employees]
    active_emp_ids = [e['id'] for e in employees if e['status'] == 'active']

    # ────────────── ENTITY: ATTENDANCE (500+) ──────────────
    print("⌚ Seeding Attendance...")
    attendance = []
    for eid in active_emp_ids[:50]: # Historical data for 50 employees
        for d in range(30):
            date = (get_now() - timedelta(days=d)).strftime("%Y-%m-%d")
            status = random.choice(["present"] * 8 + ["absent", "wfh"])
            attendance.append({
                "id": str(uuid.uuid4()),
                "employee_id": eid,
                "date": date,
                "check_in": "09:" + str(random.randint(0, 30)).zfill(2),
                "check_out": "18:" + str(random.randint(0, 59)).zfill(2) if status != "absent" else None,
                "status": status,
                "organization_id": ORG_ID,
                "created_at": get_now().isoformat()
            })
    await db.attendance.insert_many(attendance)

    # ────────────── ENTITY: PROJECTS & TASKS (20+ / 100+) ──────────────
    print("🏗️ Seeding Projects & Tasks...")
    projects = []
    for i in range(15):
        pid = str(uuid.uuid4())
        projects.append({
            "id": pid,
            "name": f"{random.choice(COMPANIES)} - {random.choice(['Core', 'API', 'Migration', 'Portal'])}",
            "description": "Standard production project for system testing and integration.",
            "status": random.choice(["active", "completed", "active"]),
            "organization_id": ORG_ID,
            "created_at": random_date(100)
        })
    await db.projects.insert_many(projects)
    proj_ids = [p['id'] for p in projects]

    tasks = []
    for pid in proj_ids:
        for j in range(8):
            tasks.append({
                "id": str(uuid.uuid4()),
                "project_id": pid,
                "title": f"Dev Sprint {j+1} Task",
                "assigned_to": random.choice(active_emp_ids),
                "status": random.choice(["todo", "in-progress", "done", "blocked"]),
                "priority": random.choice(["low", "medium", "high", "critical"]),
                "organization_id": ORG_ID,
                "created_at": get_now().isoformat()
            })
    await db.tasks.insert_many(tasks)

    # ────────────── ENTITY: CRM (100+ LEADS) ──────────────
    print("💼 Seeding CRM Leads & Deals...")
    leads = []
    for i in range(110):
        leads.append({
            "id": str(uuid.uuid4()),
            "name": f"Lead {i+1} - {random.choice(FIRST_NAMES)}",
            "email": f"contact{i}@external-prospect.com",
            "company": random.choice(COMPANIES),
            "phone": "+1 555-010" + str(i).zfill(2),
            "source": random.choice(LEAD_SOURCES),
            "status": random.choice(LEAD_STATUSES),
            "organization_id": ORG_ID,
            "created_at": random_date(60)
        })
    await db.leads.insert_many(leads)
    lead_ids = [l['id'] for l in leads]

    deals = []
    for lid in lead_ids[:60]: # Convert some leads to deals
        deals.append({
            "id": str(uuid.uuid4()),
            "lead_id": lid,
            "title": f"Enterprise Deal - {random.choice(COMPANIES)}",
            "value": random.randint(10000, 500000),
            "stage": random.choice(DEAL_STAGES),
            "probability": random.randint(10, 100),
            "organization_id": ORG_ID,
            "created_at": get_now().isoformat()
        })
    await db.deals.insert_many(deals)

    # ────────────── ENTITY: FINANCE (100+ INVOICES / EXPENSES) ──────────────
    print("💰 Seeding Financials...")
    customers = []
    for i in range(25):
        cid = str(uuid.uuid4())
        customers.append({
            "id": cid, "name": f"{random.choice(COMPANIES)} Group", 
            "email": f"billing@{i}.com", "organization_id": ORG_ID, "created_at": random_date(200)
        })
    await db.customers.insert_many(customers)
    cust_ids = [c['id'] for c in customers]

    invoices = []
    for i in range(105):
        val = random.uniform(1000, 200000)
        invoices.append({
            "id": str(uuid.uuid4()),
            "invoice_number": f"INV-2024-{str(i).zfill(4)}",
            "customer_id": random.choice(cust_ids),
            "total_amount": val,
            "status": random.choice(INVOICE_STATUSES),
            "due_date": (get_now() + timedelta(days=random.randint(-30, 30))).strftime("%Y-%m-%d"),
            "items": [{"desc": "Cloud Licenses", "qty": 1, "rate": val}],
            "organization_id": ORG_ID,
            "created_at": random_date(180)
        })
    await db.invoices.insert_many(invoices)

    expenses = []
    for i in range(120):
        expenses.append({
            "id": str(uuid.uuid4()),
            "employee_id": random.choice(active_emp_ids),
            "category": random.choice(["Travel", "Hardware", "Software", "Meals"]),
            "amount": random.uniform(500, 25000),
            "status": random.choice(["approved", "pending", "rejected"]),
            "date": random_date_str(90),
            "description": "Standard business expense record.",
            "organization_id": ORG_ID,
            "created_at": get_now().isoformat()
        })
    await db.expenses.insert_many(expenses)

    # ────────────── ENTITY: INVENTORY (100+) ──────────────
    print("📦 Seeding Inventory...")
    inventory = []
    for i in range(100):
        inventory.append({
            "id": str(uuid.uuid4()),
            "name": f"Module_{i} Item",
            "category": random.choice(["Laptops", "Furniture", "Supplies", "Mobile"]),
            "quantity": random.randint(0, 500) if i > 5 else 0, # Edge case: 0 stock
            "unit": "piece",
            "price_per_unit": random.uniform(10, 5000),
            "location": random.choice(CITIES),
            "organization_id": ORG_ID,
            "created_at": random_date(300)
        })
    await db.inventory.insert_many(inventory)

    # ────────────── ENTITY: TICKETS (50+) ──────────────
    print("🎫 Seeding Tickets...")
    tickets = []
    for i in range(55):
        tickets.append({
            "id": str(uuid.uuid4()),
            "subject": f"System Alert {i}",
            "description": "Issue reported during production load testing.",
            "priority": random.choice(["low", "medium", "high", "critical"]),
            "status": random.choice(["open", "in-progress", "closed"]),
            "assigned_to": random.choice(active_emp_ids),
            "contact_email": f"user{i}@client.com",
            "organization_id": ORG_ID,
            "created_at": random_date(20)
        })
    await db.tickets.insert_many(tickets)

    # ────────────── ENTITY: ASSETS ──────────────
    print("🏢 Seeding Assets...")
    assets = []
    for i in range(50):
        assets.append({
            "id": str(uuid.uuid4()),
            "name": f"Asset_{i}",
            "type": random.choice(["Electronics", "Machinery", "Building", "Software"]),
            "value": random.uniform(50000, 10000000),
            "purchase_date": random_date_str(1000),
            "depreciation_rate": random.uniform(0.05, 0.2),
            "organization_id": ORG_ID,
            "created_at": random_date(1000)
        })
    await db.assets.insert_many(assets)

    print("\n✅ PRODUCTION-GRADE SEEDING COMPLETE!")
    print(f"Summary: 120 Employees, 1500+ Attendance records, 110 Leads, 60 Deals, 105 Invoices, 120 Expenses, 100 Inventory items, 55 Tickets.")

if __name__ == "__main__":
    asyncio.run(seed_all())
