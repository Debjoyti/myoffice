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

    # Test PO negative quantity
    res = requests.post(f"{API}/purchase-orders", json={
        "purchase_request_id": "pr123",
        "store_id": "store1",
        "supplier_name": "Test Supplier",
        "total_amount": 1000,
        "created_by": "user1",
        "items": [
            {"name": "Item 1", "quantity": -5, "price": 100}
        ]
    }, headers=headers)
    print(f"PO negative quantity test status: {res.status_code}") # Should be 400

    # Test Payment invalid invoice
    res = requests.post(f"{API}/payments", json={
        "invoice_id": "non-existent",
        "amount": 100,
        "payment_method": "Cash",
        "payment_date": "2024-01-01"
    }, headers=headers)
    print(f"Payment invalid invoice test status: {res.status_code}") # Should be 404

test_validation()
