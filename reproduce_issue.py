import asyncio
import os
import sys
from pathlib import Path
from unittest.mock import MagicMock

# Set up environment for the backend
os.environ["SECRET_KEY"] = "test-secret"
os.environ["ENVIRONMENT"] = "test"
os.environ["MONGO_URL"] = "" # Use fallback DB

# Add backend to path
backend_path = str(Path(__file__).parent / "backend")
sys.path.append(backend_path)

async def test_leak():
    import main
    from main import get_leave_requests, db

    # Clear DB
    await db.leave_requests.delete_many({})

    # Seed some data
    org1 = "org1"
    org2 = "org2"

    await db.leave_requests.insert_one({
        "id": "leave1",
        "employee_id": "emp1", # Employee ID
        "organization_id": org1,
        "status": "pending",
        "created_at": "2024-01-01T00:00:00"
    })
    await db.leave_requests.insert_one({
        "id": "leave2",
        "employee_id": "emp2",
        "organization_id": org2,
        "status": "pending",
        "created_at": "2024-01-02T00:00:00"
    })

    # Mock users
    # In main.py, User model has id, organization_id, role, etc.
    user_org1_admin = {"id": "admin_user_id", "role": "admin", "organization_id": org1}
    user_org1_emp = {"id": "emp1", "role": "employee", "organization_id": org1}
    user_org1_emp_wrong_id = {"id": "user1_id", "role": "employee", "organization_id": org1}
    user_superadmin = {"id": "super_user_id", "role": "superadmin"}

    print("--- Running Tests ---")

    # Test Admin Org 1
    leaves = await get_leave_requests(current_user=user_org1_admin)
    ids = [l["id"] if isinstance(l, dict) else l.id for l in leaves]
    print(f"Admin Org 1 (should see leave1): {ids}")

    # Test Employee Org 1 with id matching employee_id
    leaves = await get_leave_requests(current_user=user_org1_emp)
    ids = [l["id"] if isinstance(l, dict) else l.id for l in leaves]
    print(f"Employee Org 1 with matched ID (should see leave1): {ids}")

    # Test Employee Org 1 with id NOT matching employee_id
    leaves = await get_leave_requests(current_user=user_org1_emp_wrong_id)
    ids = [l["id"] if isinstance(l, dict) else l.id for l in leaves]
    print(f"Employee Org 1 with mismatched ID (should see nothing): {ids}")

    # Test Superadmin
    leaves = await get_leave_requests(current_user=user_superadmin)
    ids = [l["id"] if isinstance(l, dict) else l.id for l in leaves]
    print(f"Superadmin (should see both): {ids}")

if __name__ == "__main__":
    asyncio.run(test_leak())
