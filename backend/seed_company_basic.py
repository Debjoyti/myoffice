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

INDUSTRIES = [
    'Technology', 'Manufacturing', 'Finance & Banking', 'Healthcare', 'Retail & E-Commerce',
    'Construction', 'Education', 'Logistics & Transport', 'Food & Beverage', 'Consulting',
    'Media & Entertainment', 'Real Estate', 'Agriculture', 'Pharma', 'Government'
]

CITIES = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad"]
STATES = ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Telangana", "Maharashtra", "West Bengal", "Gujarat"]

def get_now(): return datetime.now(timezone.utc).isoformat()

async def seed_companies():
    print("[SYSTEM] SEEDING 100+ COMPANIES (BASIC DETAIL)...")
    
    # Get Primary Org
    user = await db.users.find_one({"role": "admin"}) or await db.users.find_one({})
    org_id = user.get('organization_id', 'default') if user else 'default'
    onboarded_by = user.get('name', 'System Admin') if user else 'System Admin'

    companies = []
    
    for i in range(115): # 115 items total
        company_id = str(uuid.uuid4())
        name = f"Company {i + 1} {random.choice(['Solutions', 'Systems', 'Ventures', 'Corp', 'Group'])}"
        
        # Edge case: Super long name
        if i == 50:
            name = "Alpha Beta Gamma Delta Epsilon Zeta Eta Theta Iota Kappa Lambda Mu Solutions Private Limited International"
        
        # Plant Generation (1-5 plants)
        plants = []
        num_plants = random.randint(1, 5)
        for p_idx in range(num_plants):
            plants.append({
                "id": str(uuid.uuid4()),
                "company_id": company_id,
                "plant_code": f"PL-{i+1}-{p_idx+1}",
                "created_at": get_now()
            })

        # Soft Delete edge case (10% deleted)
        deleted_at = None
        status = "active"
        if i % 10 == 0:
            deleted_at = get_now()
            status = "deleted"

        companies.append({
            "id": company_id,
            "organization_id": org_id,
            "name": name,
            "company_code": f"CMP-{1000 + i}",
            "legal_name": f"{name} Pvt. Ltd.",
            "industry": random.choice(INDUSTRIES),
            "email": f"contact{i}@company{i}.com",
            "phone": f"+91 {random.randint(7000000000, 9999999999)}",
            "website": f"https://www.company{i}.com",
            "address": f"Address Line {i}, Sector {random.randint(1, 100)}",
            "city": random.choice(CITIES),
            "state": random.choice(STATES),
            "country": "India",
            "pincode": str(random.randint(100000, 999999)),
            "pan_number": f"ABCDE{random.randint(1000, 9999)}F",
            "gst_number": f"27ABCDE{random.randint(1000, 9999)}F1Z5",
            "cin_number": f"U{random.randint(10000, 99999)}MH202{random.randint(0, 4)}PTC{random.randint(100000, 999999)}",
            "esi_account_no": str(random.randint(1000000000, 9999999999)) if i % 3 != 0 else None,
            "uan_account_no": str(random.randint(1000000000, 9999999999)) if i % 4 != 0 else None,
            "eway_bill_account": f"EWB-{i*77}",
            "payment_barcode": None, # Assuming no file blobs for seed generally
            "logo": None,
            "stamp": None,
            "plants": plants,
            "status": status,
            "onboarded_by": onboarded_by,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=random.randint(0, 100))).isoformat(),
            "updated_at": get_now(),
            "deleted_at": deleted_at
        })

    # Clear existing
    await db.companies.delete_many({"organization_id": org_id})
    
    # Insert
    if companies:
        await db.companies.insert_many(companies)
        print(f"SUCCESS: Successfully seeded {len(companies)} companies with total {sum(len(c['plants']) for c in companies)} plants.")

if __name__ == "__main__":
    asyncio.run(seed_companies())
