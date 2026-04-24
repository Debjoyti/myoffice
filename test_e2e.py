import requests
import string
import random

API = "http://127.0.0.1:8000/api"

# 1. Register a new user
email = f"test_{''.join(random.choices(string.ascii_lowercase, k=6))}@example.com"
password = "password123"
res = requests.post(f"{API}/auth/register", json={"name": "Test User", "email": email, "password": password})
if res.status_code != 200:
    print(f"Register failed: {res.json()}")
assert res.status_code == 200
token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print("Login successful")

# 2. Get Jobs to find one
res = requests.get(f"{API}/jobs", headers=headers)
assert res.status_code == 200
jobs = res.json()
if not jobs:
    print("No jobs found, creating one...")
    res = requests.post(f"{API}/jobs", headers=headers, json={"title": "Software Eng", "department": "Eng", "location": "Remote", "type": "Full-time", "description": "Test"})
    assert res.status_code == 200
    job_id = res.json()["id"]
else:
    job_id = jobs[0]["id"]
print(f"Using job ID: {job_id}")

# 3. Apply for Job
payload = {
    "job_id": job_id,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "resume_text": "Skills: React",
    "peer_rating": 4.5
}
res = requests.post(f"{API}/careers/apply", json=payload)
if res.status_code != 200:
    print(f"Apply failed: {res.json()}")
assert res.status_code == 200
print("Application submitted successfully")

# 4. Generate Payslip
payslip_payload = {
    "employee_id": "dummy_emp_1",
    "net_salary": 50000,
    "earnings": [{"name": "Basic", "amount": 60000}],
    "deductions": [{"name": "Tax", "amount": 10000}]
}
res = requests.post(f"{API}/payslips", headers=headers, json=payslip_payload)
if res.status_code != 200:
    print(f"Payslip failed: {res.json()}")
assert res.status_code == 200
print("Payslip stored successfully")

print("All End-to-End steps verified via API!")
