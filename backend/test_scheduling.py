import pytest
from fastapi.testclient import TestClient
from main import app
from fallback_db import InMemoryDatabase
import main

# ensure fallback DB
main.db = InMemoryDatabase()

client = TestClient(app)

def test_scheduling_endpoint():
    req_data = {
        "num_employees": 3,
        "num_days": 5,
        "num_shifts": 2
    }

    res = client.post("/api/scheduling/schedule", json=req_data)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "schedule" in data
    assert len(data["schedule"]) == 5
