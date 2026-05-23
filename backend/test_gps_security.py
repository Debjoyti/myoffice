import pytest
from fastapi.testclient import TestClient
from main import app, db
import uuid
from datetime import datetime, timezone

client = TestClient(app)

@pytest.mark.asyncio
async def test_gps_endpoints_security():
    # Setup mock data
    trip_id = str(uuid.uuid4())
    user_id = "user123"
    org_id = "org123"

    trip = {
        "id": trip_id,
        "user_id": user_id,
        "organization_id": org_id,
        "title": "Test Trip",
        "status": "active",
        "start_time": datetime.now(timezone.utc).isoformat()
    }
    await db.trips.insert_one(trip)

    from main import get_current_user

    async def mock_get_current_user_owner():
        return {"id": user_id, "organization_id": org_id, "role": "user"}

    async def mock_get_current_user_other():
        return {"id": "other_user", "organization_id": "other_org", "role": "user"}

    async def mock_get_current_user_admin_same_org():
        return {"id": "admin_user", "organization_id": org_id, "role": "admin"}

    async def mock_get_current_user_superadmin():
        return {"id": "super_user", "organization_id": "any_org", "role": "superadmin"}

    # Test Owner Access
    app.dependency_overrides[get_current_user] = mock_get_current_user_owner
    response = client.get(f"/api/trip/{trip_id}")
    assert response.status_code == 200

    # Test Other User Access (Denied)
    app.dependency_overrides[get_current_user] = mock_get_current_user_other
    response = client.get(f"/api/trip/{trip_id}")
    assert response.status_code == 403

    # Test Admin Same Org Access (Allowed)
    app.dependency_overrides[get_current_user] = mock_get_current_user_admin_same_org
    response = client.get(f"/api/trip/{trip_id}")
    assert response.status_code == 200

    # Test Superadmin Access (Allowed)
    app.dependency_overrides[get_current_user] = mock_get_current_user_superadmin
    response = client.get(f"/api/trip/{trip_id}")
    assert response.status_code == 200

    # Cleanup
    await db.trips.delete_one({"id": trip_id})
    app.dependency_overrides.clear()

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_gps_endpoints_security())
