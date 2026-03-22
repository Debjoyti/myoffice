import asyncio
import random
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timedelta, timezone
import uuid

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'myoffice')

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Configuration
ORGANIZATION_ID = "default"
COUNT_EMPLOYEES = 50
COUNT_PROJECTS = 8
COUNT_LEADS = 15

# Mock Data Sets
FIRST_NAMES = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vijay', 'Anjali', 'Rajesh', 'Pooja', 'Sanjay', 'Neha']
LAST_NAMES = ['Sharma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Verma', 'Reddy', 'Shah', 'Joshi', 'Mehta']
DEPTS = ['Engineering', 'Product', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations']
CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune']
PROJECT_NAMES = ['Cloud Migration', 'AI Analytics', 'Mobile App V2', 'Security Audit', 'Market Expansion']
LEAD_COMPANIES = ['Global Tech', 'NextGen Solutions', 'Prime Dynamics', 'Future Soft', 'Vertex Labs']
STORE_NAMES = ['Main Central Warehouse', 'Northern Hub', 'Bangalore Storage', 'Mumbai Distribution']

ITEM_CATALOG = [
    {"name": "HP LaserJet Printer", "unit": "piece", "unit_price": 18500},
    {"name": "Office Chair (Ergonomic)", "unit": "piece", "unit_price": 7200},
    {"name": "A4 Paper Ream (500 sheets)", "unit": "ream", "unit_price": 320},
    {"name": "Laptop Dell Inspiron 15", "unit": "piece", "unit_price": 62000},
    {"name": "Whiteboard Marker Set", "unit": "set", "unit_price": 180},
    {"name": "USB Hub 7-Port", "unit": "piece", "unit_price": 950},
    {"name": "Wireless Mouse + Keyboard Combo", "unit": "set", "unit_price": 1850},
]

async def seed():
    print("🚀 Starting PERFECT Data Seeding...")
    # Purge EVERYTHING
    collections = await db.list_collection_names()
    for c in collections:
        if c != "users": # Keep demo users if they exist
            await db[c].delete_many({})
    
    # 1. Stores (Crucial for PR/PO etc)
    stores = []
    for i, name in enumerate(STORE_NAMES):
        sid = str(uuid.uuid4())
        stores.append({
            'id': sid,
            'name': name,
            'location': random.choice(CITIES),
            'status': 'active',
            'organization_id': ORGANIZATION_ID,
            'created_at': datetime.now(timezone.utc).isoformat()
        })
    await db.stores.insert_many(stores)
    store_ids = [s['id'] for s in stores]

    # 2. Employees
    employees = []
    for i in range(COUNT_EMPLOYEES):
        fn = random.choice(FIRST_NAMES)
        ln = random.choice(LAST_NAMES)
        emp = {
            'id': str(uuid.uuid4()),
            'name': f"{fn} {ln}",
            'email': f"{fn.lower()}.{ln.lower()}{i}@company.com",
            'phone': f"+91 9{random.randint(100000000, 999999999)}",
            'department': random.choice(DEPTS),
            'designation': random.choice(['Engineer', 'Manager', 'Lead', 'Executive']),
            'status': 'active',
            'organization_id': ORGANIZATION_ID,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        employees.append(emp)
    await db.employees.insert_many(employees)
    emp_ids = [e['id'] for e in employees]

    # 3. Attendance & Leaves
    attendance = []
    leaves = []
    for eid in emp_ids:
        for d in range(10): # 10 days of history
            date = (datetime.now(timezone.utc) - timedelta(days=d)).strftime('%Y-%m-%d')
            attendance.append({
                'id': str(uuid.uuid4()),
                'employee_id': eid,
                'date': date, 'status': 'present', 'check_in': '09:00', 'check_out': '18:00',
                'organization_id': ORGANIZATION_ID, 'created_at': datetime.now(timezone.utc).isoformat()
            })
        if random.random() > 0.8:
            leaves.append({
                'id': str(uuid.uuid4()), 'employee_id': eid,
                'employee_name': next(e['name'] for e in employees if e['id'] == eid),
                'type': 'vacation', 'start_date': '2024-05-01', 'end_date': '2024-05-05',
                'reason': 'Vacation', 'status': 'pending',
                'organization_id': ORGANIZATION_ID, 'created_at': datetime.now(timezone.utc).isoformat()
            })
    await db.attendance.insert_many(attendance)
    if leaves: await db.leave_requests.insert_many(leaves)

    # 4. Projects, Tasks, Timesheets
    for i in range(COUNT_PROJECTS):
        pid = str(uuid.uuid4())
        await db.projects.insert_one({
            'id': pid, 'name': f"{random.choice(PROJECT_NAMES)} {i+1}",
            'status': 'active', 'organization_id': ORGANIZATION_ID,
            'created_at': datetime.now(timezone.utc).isoformat()
        })
        for j in range(5):
            tid = str(uuid.uuid4())
            await db.tasks.insert_one({
                'id': tid, 'project_id': pid, 'title': f"Task {j+1}",
                'status': random.choice(['todo', 'in-progress', 'done']),
                'organization_id': ORGANIZATION_ID, 'created_at': datetime.now(timezone.utc).isoformat()
            })
            await db.timesheets.insert_one({
                'id': str(uuid.uuid4()), 'project_id': pid, 'task_id': tid,
                'employee_id': random.choice(emp_ids), 'hours': float(random.randint(2, 8)),
                'date': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
                'organization_id': ORGANIZATION_ID, 'created_at': datetime.now(timezone.utc).isoformat()
            })

    # 5. CRM, Finance (Invoices, Expenses)
    for i in range(COUNT_LEADS):
        lid = str(uuid.uuid4())
        await db.leads.insert_one({
            'id': lid, 'name': f"Lead {i+1}", 'company': random.choice(LEAD_COMPANIES),
            'status': 'new', 'organization_id': ORGANIZATION_ID, 'created_at': datetime.now(timezone.utc).isoformat()
        })
    for i in range(15):
        await db.invoices.insert_one({
            'id': str(uuid.uuid4()), 'invoice_number': f"INV-24-{i+100}",
            'total_amount': float(random.randint(10000, 200000)),
            'status': random.choice(['paid', 'sent', 'overdue']),
            'due_date': '2024-06-01', 'organization_id': ORGANIZATION_ID, 'created_at': datetime.now(timezone.utc).isoformat()
        })
    for i in range(20):
        await db.expenses.insert_one({
            'id': str(uuid.uuid4()), 'category': 'Travel', 'amount': float(random.randint(500, 5000)),
            'date': '2024-04-10', 'status': 'approved', 'organization_id': ORGANIZATION_ID, 'created_at': datetime.now(timezone.utc).isoformat()
        })

    # 6. Procurement (PRs, POs)
    for i in range(5):
        pr_id = str(uuid.uuid4())
        await db.purchase_requests.insert_one({
            'id': pr_id, 'store_id': random.choice(store_ids),
            'items': [random.choice(ITEM_CATALOG)], 'total_amount': 50000.0,
            'status': 'approved', 'organization_id': ORGANIZATION_ID,
            'created_at': datetime.now(timezone.utc).isoformat()
        })
        await db.purchase_orders.insert_one({
            'id': str(uuid.uuid4()), 'purchase_request_id': pr_id,
            'store_id': random.choice(store_ids), 'supplier_name': 'Ratan Electronics',
            'items': [random.choice(ITEM_CATALOG)], 'total_amount': 50000.0,
            'status': 'pending', 'organization_id': ORGANIZATION_ID,
            'created_at': datetime.now(timezone.utc).isoformat()
        })

    # 7. Inventory, Assets, Tickets, KB, Announcements
    for i in range(10):
        await db.inventory.insert_one({
            'id': str(uuid.uuid4()), 'name': f"Item {i+1}", 'quantity': random.randint(10, 100),
            'organization_id': ORGANIZATION_ID, 'created_at': datetime.now(timezone.utc).isoformat()
        })
        await db.assets.insert_one({
            'id': str(uuid.uuid4()), 'name': f"MacBook {i+1}", 'status': 'available',
            'organization_id': ORGANIZATION_ID, 'created_at': datetime.now(timezone.utc).isoformat()
        })
    await db.tickets.insert_one({'id': str(uuid.uuid4()), 'subject': 'IT Help', 'status': 'open', 'organization_id': ORGANIZATION_ID, 'created_at': datetime.now(timezone.utc).isoformat()})
    await db.kb.insert_one({'id': str(uuid.uuid4()), 'title': 'Guidelines', 'content': '...', 'organization_id': ORGANIZATION_ID, 'created_at': datetime.now(timezone.utc).isoformat()})
    await db.announcements.insert_one({'id': str(uuid.uuid4()), 'title': 'Happy New Year', 'content': '...', 'organization_id': ORGANIZATION_ID, 'created_at': datetime.now(timezone.utc).isoformat()})

    print("\n✨ ALL COLLECTIONS POPULATED! Demo is 100% exploreable.")

if __name__ == '__main__':
    asyncio.run(seed())
