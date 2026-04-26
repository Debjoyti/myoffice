import requests
import json
import uuid

API = "http://127.0.0.1:8000/api"

def test_validation():
    # Register and login
    email = f"val_test_{uuid.uuid4().hex[:6]}@example.com"
    req = requests.post(f"{API}/auth/register", json={"name": "Val Test", "email": email, "password": "Password123!"})
    token = req.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Test Department Duplication
    res = requests.post(f"{API}/departments", json={"name": "Sales"}, headers=headers)
    assert res.status_code == 200
    res2 = requests.post(f"{API}/departments", json={"name": "Sales"}, headers=headers)
    print(f"Department duplication test status: {res2.status_code}") # Should be 400

    # 2. Test Invalid Position in Employee
    res = requests.post(f"{API}/employees", json={
        "name": "Bad Emp",
        "position_id": "invalid-id",
        "email": "bad@emp.com",
        "phone": "123",
        "department": "Engineering",
        "designation": "Dev"
    }, headers=headers)
    print(f"Invalid position test status: {res.status_code}") # Should be 404

    # 3. Empty string validation
    res = requests.post(f"{API}/departments", json={"name": ""}, headers=headers)
    print(f"Empty string department test status: {res.status_code}") # Should be 422

test_validation()
