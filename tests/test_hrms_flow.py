import requests
import json
import sys
import uuid

BASE_URL = "http://127.0.0.1:8000/api"

def get_token():
    # Attempt register first with unique email to avoid conflicts
    unique_email = f"testadmin_{uuid.uuid4().hex[:8]}@test.com"
    req = requests.post(f"{BASE_URL}/auth/register", json={"email": unique_email, "password": "Password123!", "name": "Test Admin"})

    res = requests.post(f"{BASE_URL}/auth/login", json={"email": unique_email, "password": "Password123!"})
    if res.status_code == 200:
        return res.json().get("access_token")

    print(f"Failed to get token. Login response: {res.status_code} {res.text}")
    raise Exception("Could not login to get token")

def run_tests():
    try:
        token = get_token()
    except Exception as e:
        print(f"CRITICAL ERROR: Failed to obtain token. Exception: {e}")
        sys.exit(1)

    headers = {"Authorization": f"Bearer {token}"}
    print("Logged in successfully.")

    try:
        # 1. Create Department
        print("Creating Department...")
        dept_res = requests.post(f"{BASE_URL}/departments", json={"name": "Engineering"}, headers=headers)
        assert dept_res.status_code == 200, f"Failed: {dept_res.text}"
        dept_id = dept_res.json()["id"]

        # 2. Create Position
        print("Creating Position...")
        pos_res = requests.post(f"{BASE_URL}/positions", json={"title": "Software Engineer", "department_id": dept_id}, headers=headers)
        assert pos_res.status_code == 200, f"Failed: {pos_res.text}"
        pos_id = pos_res.json()["id"]

        # 3. Create Employee (Onboarding)
        print("Creating Employee...")
        emp_res = requests.post(f"{BASE_URL}/employees", json={
            "name": "Jane Doe",
            "email": "jane@example.com",
            "phone": "1234567890",
            "department": "Engineering",
            "designation": "Software Engineer",
            "position_id": pos_id
        }, headers=headers)
        assert emp_res.status_code == 200, f"Failed: {emp_res.text}"
        emp_id = emp_res.json()["id"]

        # 4. Generate Salary Suggestion
        print("Generating Salary Suggestion...")
        sug_res = requests.post(f"{BASE_URL}/salary-structure/suggest", json={
            "emp_id": emp_id,
            "annual_ctc": 600000 # 50,000 / month
        }, headers=headers)
        assert sug_res.status_code == 200, f"Failed: {sug_res.text}"
        suggestion = sug_res.json()

        # 5. Save Salary Structure
        print("Saving Salary Structure...")
        components = [{"component_id": c["component_name"], "suggested_amount": c["suggested_amount"], "final_amount": c["final_amount"], "type": c["type"]} for c in suggestion["components"]]
        struct_res = requests.post(f"{BASE_URL}/salary-structure", json={
            "emp_id": emp_id,
            "components": components,
            "pf_enabled": True,
            "esi_enabled": False
        }, headers=headers)
        assert struct_res.status_code == 200, f"Failed: {struct_res.text}"

        # 6. Run Payroll
        print("Running Payroll...")
        pay_res = requests.post(f"{BASE_URL}/payroll/run", json={"month": "2024-05"}, headers=headers)
        assert pay_res.status_code == 200, f"Failed: {pay_res.text}"
        payroll_id = pay_res.json()["id"]

        # 7. Lock Payroll
        print("Locking Payroll...")
        lock_res = requests.post(f"{BASE_URL}/payroll/{payroll_id}/lock", headers=headers)
        assert lock_res.status_code == 200, f"Failed: {lock_res.text}"

        print("All E2E workflow tests passed successfully!")

    except AssertionError as ae:
        print(f"TEST FAILED: {ae}")
        sys.exit(1)
    except Exception as e:
        print(f"TEST FAILED WITH EXCEPTION: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
