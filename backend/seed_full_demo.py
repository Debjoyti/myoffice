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
ORGANIZATION_ID = "default" # Usually you'd get this from a specific user
COUNT_EMPLOYEES = 25
COUNT_PROJECTS = 6
COUNT_LEADS = 12

# Mock Data Sets
FIRST_NAMES = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vijay', 'Anjali', 'Rajesh', 'Pooja', 'Sanjay', 'Neha', 'Karan', 'Meena', 'Deepak', 'Tanvi', 'Arjun']
LAST_NAMES = ['Sharma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Verma', 'Reddy', 'Shah', 'Joshi', 'Mehta', 'Kulkarni', 'Deshmukh', 'Yadav', 'Malhotra']
DEPTS = ['Engineering', 'Product', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Quality Assurance']
CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata']
PROJECT_NAMES = ['Project Pegasus (Cloud)', 'Project Phoenix (AI)', 'Legacy System Migration', 'SecureLink VPN v2', 'Global HR Portal', 'FinTrack Optimization']
LEAD_COMPANIES = ['Global Tech Solutions', 'NextGen Prime', 'Dynamic Ventures', 'Vertex Labs', 'Infinite Soft', 'Sterling Global', 'Pioneer Systems']
STORE_NAMES = ['Central Warehouse (Mumbai)', 'Bangalore Logistics Hub', 'Delhi Distribution Center']

ITEM_CATALOG = [
    {"name": "Dell XPS 13 Laptop", "category": "Hardware", "unit": "piece", "price_per_unit": 95000, "location": "Warehouse A"},
    {"name": "Ergonomic Office Chair", "category": "Furniture", "unit": "piece", "price_per_unit": 12500, "location": "Warehouse B"},
    {"name": "A4 Paper Bundle", "category": "Office Supplies", "unit": "bundle", "price_per_unit": 450, "location": "Warehouse A"},
    {"name": "USB-C To HDMI Adapter", "category": "Accessories", "unit": "piece", "price_per_unit": 1200, "location": "Warehouse B"},
    {"name": "Logitech Wireless Mouse", "category": "Accessories", "unit": "piece", "price_per_unit": 1800, "location": "Warehouse A"},
    {"name": "27-inch 4K Monitor", "category": "Hardware", "unit": "piece", "price_per_unit": 28000, "location": "Warehouse C"},
]

async def seed():
    print("🚀 Starting COMPREHENSIVE Data Seeding...")
    
    # 1. Clear existing data (keeping users)
    collections = await db.list_collection_names()
    for c in collections:
        if c != "users":
            await db[c].delete_many({})
    
    # 2. Get a valid user (or admin) to associate data with if needed
    user = await db.users.find_one({"role": "admin"}) or await db.users.find_one({})
    org_id = user['organization_id'] if user and 'organization_id' in user else ORGANIZATION_ID

    # 3. Employees
    employees = []
    for i in range(COUNT_EMPLOYEES):
        fn = random.choice(FIRST_NAMES)
        ln = random.choice(LAST_NAMES)
        eid = str(uuid.uuid4())
        employees.append({
            'id': eid,
            'emp_id': f"PRSK-{1000 + i}",
            'name': f"{fn} {ln}",
            'email': f"{fn.lower()}.{ln.lower()}{i}@company.com",
            'phone': f"+91 9{random.randint(100000000, 999999999)}",
            'department': random.choice(DEPTS),
            'designation': random.choice(['Senior Architect', 'Product Manager', 'Team Lead', 'Senior Analyst', 'UI Designer', 'Sales Manager']),
            'date_of_joining': (datetime.now(timezone.utc) - timedelta(days=random.randint(30, 1000))).strftime('%Y-%m-%d'),
            'status': 'active',
            'organization_id': org_id,
            'created_at': datetime.now(timezone.utc).isoformat()
        })
    if employees: await db.employees.insert_many(employees)
    emp_ids = [e['id'] for e in employees]

    # 4. Attendance
    attendance = []
    for eid in emp_ids:
        for d in range(15): # 15 days history
            date = (datetime.now(timezone.utc) - timedelta(days=d)).strftime('%Y-%m-%d')
            if random.random() > 0.1: # 90% attendance
                attendance.append({
                    'id': str(uuid.uuid4()), 'employee_id': eid, 'date': date,
                    'check_in': '09:15', 'check_out': '18:30', 'status': 'present',
                    'organization_id': org_id, 'created_at': datetime.now(timezone.utc).isoformat()
                })
    if attendance: await db.attendance.insert_many(attendance)

    # 5. Projects & Tasks & Timesheets
    for i, p_name in enumerate(PROJECT_NAMES):
        pid = str(uuid.uuid4())
        await db.projects.insert_one({
            'id': pid, 'name': p_name, 'description': f"Developing mission-critical components for {p_name}.",
            'status': random.choice(['active', 'completed', 'active']),
            'start_date': '2024-01-01', 'organization_id': org_id,
            'created_at': datetime.now(timezone.utc).isoformat()
        })
        # Add 5 tasks per project
        for j in range(5):
            tid = str(uuid.uuid4())
            await db.tasks.insert_one({
                'id': tid, 'project_id': pid, 'title': f"Module {j+1} - Phase Integration",
                'status': random.choice(['todo', 'in-progress', 'done']),
                'priority': random.choice(['low', 'medium', 'high']),
                'assigned_to': random.choice(emp_ids),
                'organization_id': org_id, 'created_at': datetime.now(timezone.utc).isoformat()
            })
            # Add timesheets
            await db.timesheets.insert_one({
                'id': str(uuid.uuid4()), 'project_id': pid, 'task_id': tid,
                'employee_id': random.choice(emp_ids), 'hours': random.uniform(2.5, 7.5),
                'date': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
                'organization_id': org_id, 'created_at': datetime.now(timezone.utc).isoformat()
            })

    # 6. CRM (Leads, Deals, Customers)
    customers = []
    for i in range(8):
        cid = str(uuid.uuid4())
        customers.append({
            'id': cid, 'name': random.choice(LEAD_COMPANIES), 'contact_person': random.choice(FIRST_NAMES),
            'email': f"contact{i}@example.com", 'organization_id': org_id,
            'created_at': datetime.now(timezone.utc).isoformat()
        })
    if customers: await db.customers.insert_many(customers)
    cust_ids = [c['id'] for c in customers]

    for i in range(COUNT_LEADS):
        lid = str(uuid.uuid4())
        await db.leads.insert_one({
            'id': lid, 'name': f"Inquiry - {random.choice(FIRST_NAMES)}",
            'company': random.choice(LEAD_COMPANIES), 'status': random.choice(['new', 'contacted', 'qualified']),
            'organization_id': org_id, 'created_at': datetime.now(timezone.utc).isoformat()
        })
        if random.random() > 0.5:
            await db.deals.insert_one({
                'id': str(uuid.uuid4()), 'lead_id': lid, 'title': f"Contract Renewal - {random.choice(LEAD_COMPANIES)}",
                'value': random.randint(50000, 500000), 'stage': random.choice(['proposal', 'negotiation', 'closed_won']),
                'organization_id': org_id, 'created_at': datetime.now(timezone.utc).isoformat()
            })

    # 7. Finance (Invoices, Expenses)
    for i in range(12):
        await db.invoices.insert_one({
            'id': str(uuid.uuid4()), 'invoice_number': f"PRSK-INV-{2024}-{i+500}",
            'customer_id': random.choice(cust_ids) if cust_ids else 'unknown',
            'items': [{'desc': 'Professional Services', 'qty': 1, 'rate': 45000.0}],
            'total_amount': 45000.0, 'status': random.choice(['paid', 'draft', 'pending', 'overdue']),
            'due_date': '2024-05-30', 'organization_id': org_id,
            'created_at': datetime.now(timezone.utc).isoformat()
        })
    for i in range(15):
        await db.expenses.insert_one({
            'id': str(uuid.uuid4()), 'employee_id': random.choice(emp_ids),
            'category': random.choice(['Travel', 'Software', 'Meals', 'Hardware']),
            'amount': random.uniform(1200, 8500), 'status': 'approved',
            'date': (datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30))).strftime('%Y-%m-%d'),
            'organization_id': org_id, 'created_at': datetime.now(timezone.utc).isoformat()
        })

    # 8. Stores, PRs, POs, Inventory
    stores = []
    for s_name in STORE_NAMES:
        sid = str(uuid.uuid4())
        stores.append({
            'id': sid, 'name': s_name, 'location': random.choice(CITIES), 'manager': random.choice(FIRST_NAMES),
            'status': 'active', 'organization_id': org_id, 'created_at': datetime.now(timezone.utc).isoformat()
        })
    if stores: await db.stores.insert_many(stores)
    store_ids = [s['id'] for s in stores]

    for item in ITEM_CATALOG:
        await db.inventory.insert_one({
            'id': str(uuid.uuid4()), **item, 'quantity': random.randint(5, 50),
            'organization_id': org_id, 'created_at': datetime.now(timezone.utc).isoformat()
        })

    for i in range(4):
        pr_id = str(uuid.uuid4())
        await db.purchase_requests.insert_one({
            'id': pr_id, 'store_id': random.choice(store_ids), 'requested_by': random.choice(employees)['name'],
            'items': [{'name': 'Dell Monitor', 'qty': 2, 'price': 15000}], 'total_amount': 30000.0,
            'status': 'approved', 'organization_id': org_id, 'created_at': datetime.now(timezone.utc).isoformat()
        })
        await db.purchase_orders.insert_one({
            'id': str(uuid.uuid4()), 'purchase_request_id': pr_id, 'store_id': random.choice(store_ids),
            'supplier_name': 'Global Hardware Solutions', 'total_amount': 30000.0, 'status': 'sent',
            'created_by': 'Admin', 'organization_id': org_id, 'created_at': datetime.now(timezone.utc).isoformat()
        })

    # 9. Support Tickets & Knowledge Base
    for i in range(5):
        await db.tickets.insert_one({
            'id': str(uuid.uuid4()), 'subject': f"System Issue - {i+1}", 'description': 'User reporting login delay in Pune region.',
            'priority': 'high', 'status': 'open', 'contact_email': 'support@external.com',
            'organization_id': org_id, 'created_at': datetime.now(timezone.utc).isoformat()
        })
    await db.kb.insert_one({
        'id': str(uuid.uuid4()), 'title': 'Remote Work Security SOP', 'category': 'IT Policy',
        'content': 'All employees must use authorized VPN for accessing internal servers...',
        'author_name': 'IT Dept', 'organization_id': org_id, 'created_at': datetime.now(timezone.utc).isoformat()
    })

    # 10. Announcements
    await db.announcements.insert_one({
        'id': str(uuid.uuid4()), 'title': 'Q2 Performance Reviews Starting',
        'content': 'Managers will coordinate with teams to begin the appraisal cycle next week.',
        'author_name': 'HR Central', 'priority': 'high',
        'organization_id': org_id, 'created_at': datetime.now(timezone.utc).isoformat()
    })

    # 11. New Models: Exit Management & PIP & Recruitment
    for i in range(3):
        emp = random.choice(employees)
        await db.resignations.insert_one({
            'id': str(uuid.uuid4()), 'employee_id': emp['id'], 'employee_name': emp['name'],
            'reason': 'Better Opportunity / Personal Growth', 'resignation_date': '2024-04-15',
            'last_working_day': '2024-05-15', 'status': 'approved', 'fnf_status': 'calculated',
            'organization_id': org_id, 'created_at': datetime.now(timezone.utc).isoformat()
        })
    
    for i in range(2):
        emp = random.choice(employees)
        await db.performance_plans.insert_one({
            'id': str(uuid.uuid4()), 'employee_id': emp['id'], 'employee_name': emp['name'],
            'reason': 'Consistent slow module delivery', 'goals': 'Complete Python Mastery, Deliver 3 PRs/week',
            'start_date': '2024-04-01', 'end_date': '2024-05-01', 'status': 'active',
            'organization_id': org_id, 'created_at': datetime.now(timezone.utc).isoformat()
        })
        
    for i in range(2):
        jid = str(uuid.uuid4())
        await db.job_postings.insert_one({
            'id': jid, 'title': f"Senior {random.choice(['Python Developer', 'UI Designer', 'DevOps Analyst'])}",
            'department': random.choice(DEPTS), 'location': 'Remote / Hybrid',
            'type': 'Full-time', 'description': 'Looking for candidates with 5+ years experience in scaling AI architectures.',
            'organization_id': org_id, 'created_at': datetime.now(timezone.utc).isoformat()
        })
        await db.candidates.insert_one({
            'id': str(uuid.uuid4()), 'job_id': jid, 'name': f"Candidate {i+1}",
            'email': f"hireme{i}@recruiter.com", 'status': 'screening',
            'organization_id': org_id, 'created_at': datetime.now(timezone.utc).isoformat()
        })

    # 12. AI Business Insights (The Wow Factor)
    insights = [
        {'type': 'warning', 'title': 'Churn Risk Detected', 'message': '3 high-performing engineers in Engineering Dept have upcoming notice period endings. Consider retention talks.', 'impact': 'high'},
        {'type': 'opportunity', 'title': 'Revenue Surge Potential', 'message': 'CRM Pipeline shows 5 deals in "Negotiation" phase with expected value > ₹20L. High closing probability.', 'impact': 'medium'},
        {'type': 'kpi', 'title': 'Expense Optimization', 'message': 'Travel expenses have increased by 22% this quarter. AI suggests shifting to virtual internal audits.', 'impact': 'low'}
    ]
    for insight in insights:
        await db.insights.insert_one({
            **insight, 'id': str(uuid.uuid4()), 'organization_id': org_id,
            'created_at': datetime.now(timezone.utc).isoformat()
        })

    print(f"\n✨ DONE! Seeded {COUNT_EMPLOYEES} employees, {COUNT_PROJECTS} projects, and deep data for all modules.")

if __name__ == '__main__':
    asyncio.run(seed())
