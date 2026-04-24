import requests

base_url = "http://localhost:8000/api"

def run():
    print("Testing new endpoints...")
    requests.post(f"{base_url}/auth/register", json={
        "email": "test6@test.com", "password": "password123", "name": "Test"
    })

    resp = requests.post(f"{base_url}/auth/login", json={"email": "test6@test.com", "password": "password123"})

    if resp.status_code != 200:
        print("Login failed:", resp.text)
        return

    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a store
    resp = requests.post(f"{base_url}/stores", json={"name": "Test Store", "location": "Test Loc"}, headers=headers)
    store_id = resp.json()["id"]

    # 2. Create PR
    pr_payload = {
        "store_id": store_id, "requested_by": "TestUser", "items": [{"name": "Pencils", "quantity": 100, "price": 5}], "total_amount": 500, "reason": "Test"
    }
    resp = requests.post(f"{base_url}/purchase-requests", json=pr_payload, headers=headers)
    pr_id = resp.json()["id"]

    # 3. Approve PR
    requests.patch(f"{base_url}/purchase-requests/{pr_id}/approve", headers=headers)

    # 4. Create PO
    po_payload = {
        "purchase_request_id": pr_id, "store_id": store_id, "supplier_name": "Supplier A", "items": [{"name": "Pencils", "quantity": 100, "price": 5, "unit": "box"}], "total_amount": 500, "created_by": "TestUser"
    }
    resp = requests.post(f"{base_url}/purchase-orders", json=po_payload, headers=headers)
    po_id = resp.json()["id"]

    # 5. Mark PO delivered -> triggers inventory insert
    resp = requests.patch(f"{base_url}/purchase-orders/{po_id}/status", json={"status": "delivered"}, headers=headers)
    assert resp.status_code == 200

    # Verify Inventory
    resp = requests.get(f"{base_url}/inventory", headers=headers)
    items = resp.json()
    assert len(items) > 0
    pencils_item = next((i for i in items if i["name"] == "Pencils"), None)
    assert pencils_item is not None
    assert pencils_item["quantity"] == 100
    inv_id = pencils_item["id"]

    # 6. Put Inventory
    put_payload = {
        "name": "Pencils Updated", "category": "supplies", "quantity": 150, "unit": "box", "price_per_unit": 5, "location": "Test Store"
    }
    resp = requests.put(f"{base_url}/inventory/{inv_id}", json=put_payload, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Pencils Updated"
    assert resp.json()["quantity"] == 150

    # 7. Delete PR, PO, Inventory
    resp = requests.delete(f"{base_url}/purchase-requests/{pr_id}", headers=headers)
    assert resp.status_code == 200

    resp = requests.delete(f"{base_url}/purchase-orders/{po_id}", headers=headers)
    assert resp.status_code == 200

    resp = requests.delete(f"{base_url}/inventory/{inv_id}", headers=headers)
    assert resp.status_code == 200

    print("All new endpoint tests passed successfully!")

run()
