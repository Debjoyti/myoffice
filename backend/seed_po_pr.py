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

# Realistic items for purchase requests
item_catalog = [
    {"name": "HP LaserJet Printer", "unit": "piece", "unit_price": 18500},
    {"name": "Office Chair (Ergonomic)", "unit": "piece", "unit_price": 7200},
    {"name": "A4 Paper Ream (500 sheets)", "unit": "ream", "unit_price": 320},
    {"name": "Laptop Dell Inspiron 15", "unit": "piece", "unit_price": 62000},
    {"name": "Whiteboard Marker Set", "unit": "set", "unit_price": 180},
    {"name": "Toner Cartridge (Black)", "unit": "piece", "unit_price": 2400},
    {"name": "USB Hub 7-Port", "unit": "piece", "unit_price": 950},
    {"name": "Ethernet Cable (Cat6, 10m)", "unit": "piece", "unit_price": 350},
    {"name": "Stapler + Staple Pins", "unit": "set", "unit_price": 220},
    {"name": "Notebook A5 Pack", "unit": "pack", "unit_price": 450},
    {"name": "Hand Sanitizer (500ml)", "unit": "bottle", "unit_price": 180},
    {"name": "Biscuits & Snacks Pack", "unit": "box", "unit_price": 850},
    {"name": "Tea/Coffee Kit", "unit": "box", "unit_price": 1200},
    {"name": "Extension Board (5-way)", "unit": "piece", "unit_price": 650},
    {"name": "Monitor Stand", "unit": "piece", "unit_price": 1100},
    {"name": "HDMI Cable (2m)", "unit": "piece", "unit_price": 480},
    {"name": "Wireless Mouse + Keyboard Combo", "unit": "set", "unit_price": 1850},
    {"name": "Webcam HD 1080p", "unit": "piece", "unit_price": 2900},
    {"name": "Headset with Mic", "unit": "piece", "unit_price": 1450},
    {"name": "Cleaning Kit (Screen + Keyboard)", "unit": "set", "unit_price": 320},
]

suppliers = [
    {"name": "Ratan Electronics Pvt Ltd", "contact": "+91 98200 11234"},
    {"name": "Sharma Office Supplies Co.", "contact": "+91 99300 56789"},
    {"name": "National Stationery Hub", "contact": "+91 98750 44321"},
    {"name": "TechMart India Ltd", "contact": "+91 97600 88866"},
    {"name": "Global Office Traders", "contact": "+91 98100 22233"},
    {"name": "Raj Technologies", "contact": "+91 90000 77654"},
    {"name": "Prime Supplies Corp", "contact": "+91 98500 33311"},
]

reasons = [
    "Monthly office supplies replenishment",
    "New employee onboarding kit",
    "Pantry restocking for Q1",
    "IT equipment upgrade for dev team",
    "Replacement for damaged equipment",
    "Branch office setup requirements",
    "Quarterly stationery procurement",
    "Remote work kit for new hires",
    "Conference room equipment upgrade",
    "Monthly cleaning supplies order",
]

requestors = [
    "Rahul Sharma", "Priya Patel", "Amit Gupta", "Sneha Reddy",
    "Vijay Kumar", "Anjali Singh", "Manoj Joshi", "Neha Mehta"
]

statuses_pr = ["pending", "pending", "approved", "approved", "rejected"]
statuses_po = ["pending", "pending", "confirmed", "delivered", "cancelled"]


async def seed_purchase_data():
    # Get store IDs from DB
    stores = await db.stores.find({}, {"id": 1, "_id": 0}).to_list(20)
    if not stores:
        print("No stores found! Run main seed_data.py first.")
        return
    store_ids = [s["id"] for s in stores]
    print(f"Found {len(store_ids)} stores")

    # Clear old PR/PO data
    await db.purchase_requests.delete_many({})
    await db.purchase_orders.delete_many({})
    print("Cleared existing PRs and POs")

    pr_ids = []

    # Create 15 Purchase Requests
    for i in range(15):
        days_ago = random.randint(1, 60)
        created_at = (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()
        status = random.choice(statuses_pr)

        # Pick 2-5 items
        chosen_items = random.sample(item_catalog, random.randint(2, 5))
        items = []
        total = 0
        for item in chosen_items:
            qty = random.randint(1, 10)
            subtotal = qty * item["unit_price"]
            total += subtotal
            items.append({
                "name": item["name"],
                "quantity": qty,
                "unit": item["unit"],
                "unit_price": item["unit_price"],
                "subtotal": subtotal,
            })

        pr_id = str(uuid.uuid4())
        store_id = random.choice(store_ids)

        pr_doc = {
            "id": pr_id,
            "store_id": store_id,
            "requested_by": random.choice(requestors),
            "items": items,
            "total_amount": float(total),
            "reason": random.choice(reasons),
            "status": status,
            "approved_by": random.choice(requestors) if status == "approved" else None,
            "approved_date": (datetime.now(timezone.utc) - timedelta(days=random.randint(0, days_ago))).isoformat() if status == "approved" else None,
            "created_at": created_at,
        }
        await db.purchase_requests.insert_one(pr_doc)
        pr_ids.append({"id": pr_id, "store_id": store_id, "items": items, "total": total})

    print(f"Created 15 Purchase Requests")

    # Create 10 Purchase Orders (linked to approved PRs or standalone)
    for i in range(10):
        days_ago = random.randint(1, 45)
        created_at = (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()
        delivery_date = (datetime.now(timezone.utc) + timedelta(days=random.randint(3, 21))).strftime('%Y-%m-%d')
        status = random.choice(statuses_po)

        pr_ref = random.choice(pr_ids)
        supplier = random.choice(suppliers)

        po_doc = {
            "id": str(uuid.uuid4()),
            "purchase_request_id": pr_ref["id"],
            "store_id": pr_ref["store_id"],
            "supplier_name": supplier["name"],
            "supplier_contact": supplier["contact"],
            "items": pr_ref["items"],
            "total_amount": float(pr_ref["total"]),
            "delivery_date": delivery_date,
            "status": status,
            "created_by": random.choice(requestors),
            "created_at": created_at,
        }
        await db.purchase_orders.insert_one(po_doc)

    print(f"Created 10 Purchase Orders")
    print("\nDone! You can now view PRs at /purchase-requests and POs at /purchase-orders")


if __name__ == '__main__':
    asyncio.run(seed_purchase_data())
