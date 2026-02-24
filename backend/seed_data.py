import asyncio
import random
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timedelta, timezone
import uuid

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'test_database')

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Indian names
first_names = [
    'Rahul', 'Priya', 'Amit', 'Sneha', 'Vijay', 'Anjali', 'Rajesh', 'Pooja', 'Sanjay', 'Neha',
    'Arun', 'Kavita', 'Suresh', 'Deepika', 'Manoj', 'Ria', 'Karan', 'Simran', 'Ravi', 'Meera',
    'Vishal', 'Divya', 'Arjun', 'Shreya', 'Nikhil', 'Ananya', 'Rohan', 'Sakshi', 'Akash', 'Nisha',
    'Gaurav', 'Isha', 'Ashok', 'Ritu', 'Prakash', 'Swati', 'Naveen', 'Tanvi', 'Harsh', 'Kirti',
    'Varun', 'Megha', 'Sandeep', 'Aditi', 'Mohit', 'Preeti', 'Anil', 'Nikita', 'Pankaj', 'Sonia'
]

last_names = [
    'Sharma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Verma', 'Reddy', 'Shah', 'Joshi', 'Mehta',
    'Desai', 'Iyer', 'Nair', 'Pillai', 'Rao', 'Agarwal', 'Bansal', 'Chopra', 'Malhotra', 'Sethi',
    'Kapoor', 'Bhatia', 'Sinha', 'Mishra', 'Pandey', 'Dubey', 'Saxena', 'Tiwari', 'Chawla', 'Arora',
    'Khanna', 'Gill', 'Dhawan', 'Bhatt', 'Jain', 'Ahluwalia', 'Kaur', 'Menon', 'Krishnan', 'Das'
]

departments = [
    'Engineering', 'Product', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 
    'Customer Support', 'Quality Assurance', 'Business Development'
]

designations = [
    'Software Engineer', 'Senior Software Engineer', 'Team Lead', 'Manager', 'Senior Manager',
    'Product Manager', 'Sales Executive', 'Marketing Specialist', 'HR Executive', 'Accountant',
    'Operations Executive', 'Support Engineer', 'QA Engineer', 'Business Analyst', 'Data Analyst'
]

cities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
    'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam',
    'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad'
]

async def generate_employees(count=200):
    employees = []
    for i in range(count):
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)
        name = f"{first_name} {last_name}"
        email = f"{first_name.lower()}.{last_name.lower()}{i}@company.com"
        
        # Generate realistic joining dates (past 5 years)
        days_ago = random.randint(0, 1825)
        joining_date = (datetime.now(timezone.utc) - timedelta(days=days_ago)).strftime('%Y-%m-%d')
        
        employee = {
            'id': str(uuid.uuid4()),
            'name': name,
            'email': email,
            'phone': f"+91 {random.randint(70000, 99999)} {random.randint(10000, 99999)}",
            'department': random.choice(departments),
            'designation': random.choice(designations),
            'date_of_joining': joining_date,
            'pan_number': f"{chr(random.randint(65,90))}{chr(random.randint(65,90))}{chr(random.randint(65,90))}{chr(random.randint(65,90))}{chr(random.randint(65,90))}{random.randint(1000,9999)}{chr(random.randint(65,90))}",
            'aadhaar_number': f"{random.randint(1000,9999)} {random.randint(1000,9999)} {random.randint(1000,9999)}",
            'address': f"{random.randint(1,999)}, Sector {random.randint(1,50)}, {random.choice(cities)}, {random.choice(['Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Gujarat'])}",
            'status': 'active',
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        employees.append(employee)
    
    await db.employees.insert_many(employees)
    print(f"✅ Created {count} employees")

async def generate_stores(count=10):
    stores = []
    store_names = ['Main Warehouse', 'Branch Office', 'Regional Hub', 'Distribution Center', 'Corporate Office']
    for i in range(count):
        store = {
            'id': str(uuid.uuid4()),
            'name': f"{random.choice(store_names)} {i+1}",
            'location': f"{random.choice(cities)}, {random.choice(['Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu'])}",
            'manager': f"{random.choice(first_names)} {random.choice(last_names)}",
            'contact': f"+91 {random.randint(70000, 99999)} {random.randint(10000, 99999)}",
            'status': 'active',
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        stores.append(store)
    
    await db.stores.insert_many(stores)
    print(f"✅ Created {count} stores")

async def generate_attendance_logs(employee_ids, days=30):
    attendance_logs = []
    for emp_id in employee_ids[:50]:  # Create logs for first 50 employees
        for day in range(days):
            date = (datetime.now(timezone.utc) - timedelta(days=day)).strftime('%Y-%m-%d')
            status = random.choices(['present', 'absent', 'half-day'], weights=[85, 10, 5])[0]
            
            if status != 'absent':
                check_in = f"{random.randint(8,10)}:{random.randint(0,59):02d}"
                check_out = f"{random.randint(17,19)}:{random.randint(0,59):02d}"
            else:
                check_in = None
                check_out = None
            
            log = {
                'id': str(uuid.uuid4()),
                'employee_id': emp_id,
                'date': date,
                'check_in': check_in,
                'check_out': check_out,
                'status': status,
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            attendance_logs.append(log)
    
    await db.attendance.insert_many(attendance_logs)
    print(f"✅ Created {len(attendance_logs)} attendance logs")

async def generate_projects(count=20):
    projects = []
    project_names = ['Website Redesign', 'Mobile App', 'CRM Implementation', 'Data Migration', 'Cloud Infrastructure', 
                     'AI Chatbot', 'Analytics Dashboard', 'Payment Gateway', 'Inventory System', 'Customer Portal']
    
    for i in range(count):
        days_ago = random.randint(0, 180)
        start_date = (datetime.now(timezone.utc) - timedelta(days=days_ago)).strftime('%Y-%m-%d')
        end_date = (datetime.now(timezone.utc) + timedelta(days=random.randint(30, 180))).strftime('%Y-%m-%d')
        
        project = {
            'id': str(uuid.uuid4()),
            'name': f"{random.choice(project_names)} {i+1}",
            'description': f"Strategic project for business growth and digital transformation",
            'status': random.choice(['active', 'completed']),
            'start_date': start_date,
            'end_date': end_date,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        projects.append(project)
    
    await db.projects.insert_many(projects)
    print(f"✅ Created {count} projects")

async def generate_leads(count=50):
    leads = []
    companies = ['Tech Corp', 'Global Industries', 'Future Solutions', 'Prime Enterprises', 'Smart Systems']
    sources = ['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Email Campaign']
    
    for i in range(count):
        lead = {
            'id': str(uuid.uuid4()),
            'name': f"{random.choice(companies)} Ltd",
            'email': f"contact{i}@{random.choice(['tech', 'business', 'sales'])}.com",
            'phone': f"+91 {random.randint(70000, 99999)} {random.randint(10000, 99999)}",
            'company': f"{random.choice(companies)} {i+1}",
            'source': random.choice(sources),
            'status': random.choice(['new', 'contacted', 'qualified']),
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        leads.append(lead)
    
    await db.leads.insert_many(leads)
    print(f"✅ Created {count} leads")

async def generate_expenses(employee_ids, count=100):
    expenses = []
    categories = ['travel', 'meals', 'supplies', 'software', 'marketing', 'other']
    
    for i in range(count):
        days_ago = random.randint(0, 90)
        expense_date = (datetime.now(timezone.utc) - timedelta(days=days_ago)).strftime('%Y-%m-%d')
        
        expense = {
            'id': str(uuid.uuid4()),
            'employee_id': random.choice(employee_ids[:50]),
            'category': random.choice(categories),
            'amount': float(random.randint(500, 50000)),
            'description': f"Business expense for {random.choice(categories)}",
            'date': expense_date,
            'status': random.choice(['pending', 'approved', 'rejected']),
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        expenses.append(expense)
    
    await db.expenses.insert_many(expenses)
    print(f"✅ Created {count} expenses")

async def clear_existing_data():
    await db.employees.delete_many({})
    await db.stores.delete_many({})
    await db.attendance.delete_many({})
    await db.projects.delete_many({})
    await db.leads.delete_many({})
    await db.expenses.delete_many({})
    await db.leave_requests.delete_many({})
    print("🗑️  Cleared existing data")

async def main():
    print("🚀 Starting data seeding...")
    
    # Clear existing data
    await clear_existing_data()
    
    # Generate employees first
    await generate_employees(200)
    
    # Get employee IDs
    employees = await db.employees.find({}, {'id': 1, '_id': 0}).to_list(200)
    employee_ids = [emp['id'] for emp in employees]
    
    # Generate other data
    await generate_stores(10)
    await generate_attendance_logs(employee_ids, 30)
    await generate_projects(20)
    await generate_leads(50)
    await generate_expenses(employee_ids, 100)
    
    print("\n✨ Data seeding completed successfully!")
    print(f"📊 Summary:")
    print(f"   - 200 Employees")
    print(f"   - 10 Stores")
    print(f"   - ~1500 Attendance Logs")
    print(f"   - 20 Projects")
    print(f"   - 50 Leads")
    print(f"   - 100 Expenses")
    
if __name__ == '__main__':
    asyncio.run(main())
