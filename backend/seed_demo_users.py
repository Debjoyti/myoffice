import asyncio
import os
import uuid
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'myoffice')

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str):
    return pwd_context.hash(password)

async def create_demo_users():
    # Clear existing demo users
    emails = ["superadmin@demo.com", "admin@demo.com", "employee@demo.com", "accountant@demo.com"]
    await db.users.delete_many({"email": {"$in": emails}})
    
    ORGANIZATION_ID = "default"
    SUB_END = (datetime.now(timezone.utc) + timedelta(days=365)).isoformat()
    
    # All services enabled for demo
    ENABLED_SERVICES = [
        'dashboard', 'employees', 'attendance', 'leaves', 'recruitment', 
        'projects', 'crm', 'inventory', 'finance', 'support', 
        'assets', 'announcements', 'kb', 'audit', 'insights'
    ]

    # 1. SuperAdmin (System-wide access)
    await db.users.insert_one({
        "id": str(uuid.uuid4()),
        "email": "superadmin@demo.com",
        "password": get_password_hash("password123"),
        "name": "Super Admin",
        "role": "superadmin",
        "organization_id": ORGANIZATION_ID,
        "email_verified": True,
        "subscription_status": "active",
        "subscription_end_date": SUB_END,
        "enabled_services": ENABLED_SERVICES,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # 2. Admin (Org-wide access)
    await db.users.insert_one({
        "id": str(uuid.uuid4()),
        "email": "admin@demo.com",
        "password": get_password_hash("password123"),
        "name": "Org Admin",
        "role": "admin",
        "organization_id": ORGANIZATION_ID,
        "email_verified": True,
        "subscription_status": "active",
        "subscription_end_date": SUB_END,
        "enabled_services": ENABLED_SERVICES,
        "subscription_limits": {
            "max_employees": 1000,
            "max_projects": 500
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    # 3. Employee (Restricted access)
    await db.users.insert_one({
        "id": str(uuid.uuid4()),
        "email": "employee@demo.com",
        "password": get_password_hash("password123"),
        "name": "John Employee",
        "role": "employee",
        "organization_id": ORGANIZATION_ID,
        "email_verified": True,
        "subscription_status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    # 4. Accountant (Jane)
    await db.users.insert_one({
        "id": str(uuid.uuid4()),
        "email": "accountant@demo.com",
        "password": get_password_hash("password123"),
        "name": "Jane Accountant",
        "role": "accountant",
        "company_id": "demo-comp-1",
        "organization_id": ORGANIZATION_ID,
        "email_verified": True,
        "subscription_status": "active",
        "enabled_services": ["ledger", "journal", "reports", "gst", "bank"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    print("Done: Demo users created with organization_id 'default' and password 'password123'")
    print("   - superadmin@demo.com (SuperAdmin)")
    print("   - admin@demo.com (Admin)")
    print("   - employee@demo.com (Employee)")
    print("   - accountant@demo.com (Accountant)")

if __name__ == '__main__':
    asyncio.run(create_demo_users())
