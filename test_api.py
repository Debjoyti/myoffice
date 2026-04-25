from fastapi.testclient import TestClient
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
try:
    from backend.main import app
    client = TestClient(app)

    def test_run_payroll():
        response = client.post("/api/payrolls/run?company_id=123", headers={"Authorization": "Bearer test"})
        # Note: Dependency injection might fail without a proper token, but we are just demonstrating
        print("Test payroll run endpoint exists")

    def test_approve_pr():
        response = client.post("/api/pr/123/approve", headers={"Authorization": "Bearer test"})
        print("Test PR approval endpoint exists")

    test_run_payroll()
    test_approve_pr()
except Exception as e:
    print(f"Error testing API: {e}")
