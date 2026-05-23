
import os
import sys
import pytest
from fastapi.testclient import TestClient

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Set environment variables for testing
os.environ['ENVIRONMENT'] = 'test'
os.environ['SECRET_KEY'] = 'test-secret-key'
os.environ['MONGO_URL'] = '' # Use fallback DB

from main import app, db, get_current_user

client = TestClient(app)

# Helper to create mock user
def create_mock_user(user_id, org_id, role='user', company_id=None):
    user = {
        "id": user_id,
        "organization_id": org_id,
        "role": role,
    }
    if company_id:
        user["company_id"] = company_id
    return user

@pytest.fixture(autouse=True)
def setup_db():
    # Clear stores collection before each test
    if hasattr(db.stores, 'delete_many'):
        # This is for AsyncIOMotorClient if we ever used it in test,
        # but InMemoryDatabase is synchronous in its internal _data access usually.
        # Actually InMemoryDatabase in this project might have async methods.
        pass

    # Reset InMemoryDatabase
    db.stores._data = []

def test_store_isolation():
    # Mock users from different orgs
    user1 = create_mock_user("user1", "org1")
    user2 = create_mock_user("user2", "org2")

    # Override get_current_user for user1
    app.dependency_overrides[get_current_user] = lambda: user1

    # User 1 creates a store
    store_data = {"name": "Store 1", "location": "Location 1"}
    response = client.post("/api/stores", json=store_data)
    assert response.status_code == 200
    store1_id = response.json()["id"]
    assert response.json()["organization_id"] == "org1"

    # User 1 gets their stores
    response = client.get("/api/stores")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == store1_id

    # Switch to User 2
    app.dependency_overrides[get_current_user] = lambda: user2

    # User 2 should NOT see User 1's store
    response = client.get("/api/stores")
    assert response.status_code == 200
    assert len(response.json()) == 0

    # User 2 tries to get User 1's store directly
    response = client.get(f"/api/stores/{store1_id}")
    assert response.status_code == 404

    # User 2 tries to update User 1's store
    response = client.put(f"/api/stores/{store1_id}", json={"name": "Hacked", "location": "Hacked"})
    assert response.status_code == 404

    # User 2 tries to delete User 1's store
    response = client.delete(f"/api/stores/{store1_id}")
    assert response.status_code == 404

def test_accountant_isolation():
    # Accountant for Company A
    acc_a = create_mock_user("acc_a", "org1", role="accountant", company_id="comp_a")
    # Accountant for Company B
    acc_b = create_mock_user("acc_b", "org1", role="accountant", company_id="comp_b")

    # Acc A creates a store
    app.dependency_overrides[get_current_user] = lambda: acc_a
    store_data = {"name": "Store A", "location": "Loc A"}
    response = client.post("/api/stores", json=store_data)
    assert response.status_code == 200
    store_a_id = response.json()["id"]
    assert response.json()["company_id"] == "comp_a"

    # Acc B should NOT see Store A
    app.dependency_overrides[get_current_user] = lambda: acc_b
    response = client.get("/api/stores")
    assert response.status_code == 200
    assert len(response.json()) == 0

    response = client.get(f"/api/stores/{store_a_id}")
    assert response.status_code == 404

def test_superadmin_access():
    user1 = create_mock_user("user1", "org1")
    admin = create_mock_user("admin", "any", role="superadmin")

    # User 1 creates a store
    app.dependency_overrides[get_current_user] = lambda: user1
    client.post("/api/stores", json={"name": "Org 1 Store", "location": "Loc 1"})

    # Superadmin should see all stores
    app.dependency_overrides[get_current_user] = lambda: admin
    response = client.get("/api/stores")
    assert response.status_code == 200
    assert len(response.json()) >= 1

    # Cleanup overrides
    app.dependency_overrides = {}

if __name__ == "__main__":
    # If run directly, use pytest
    import sys
    sys.exit(pytest.main([__file__]))
