import asyncio
import os
import uuid
from datetime import datetime, timezone
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
    # Clear existing users for a clean slate
    await db.users.delete_many({"email": {"$in": ["superadmin@demo.com", "client@demo.com"]}})
    
    superadmin_id = str(uuid.uuid4())
    org_id = str(uuid.uuid4())
    
    superadmin = {
        "id": superadmin_id,
        "email": "superadmin@demo.com",
        "password": get_password_hash("password123"),
        "name": "Demo SuperAdmin",
        "role": "superadmin",
        "organization_id": org_id,
        "email_verified": True,
        "subscription_status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(superadmin)
    print("✅ Created Superadmin: superadmin@demo.com / password123")
    
    client_id = str(uuid.uuid4())
    client_org_id = str(uuid.uuid4())
    client_user = {
        "id": client_id,
        "email": "client@demo.com",
        "password": get_password_hash("password123"),
        "name": "Demo Client",
        "role": "admin",
        "organization_id": client_org_id,
        "email_verified": True,
        "subscription_status": "active",
        "subscription_limits": {
            "max_employees": 10,
            "max_projects": 5
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(client_user)
    print("✅ Created Client User: client@demo.com / password123")

if __name__ == '__main__':
    asyncio.run(create_demo_users())
