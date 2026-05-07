import pytest
from fastapi.testclient import TestClient
from main import app, db
import uuid
from httpx import AsyncClient

# A lightweight test to ensure the audit log insertion wrapper logic holds without breaking
@pytest.mark.asyncio
async def test_audit_log_injection_logic():
    # This is a unit test representing the newly added audit logging flow.
    # Because we're in test env, we just verify the mock DB intercepts the insert correctly.

    # Mocking standard user and data
    mock_user = {
        "id": str(uuid.uuid4()),
        "organization_id": "test-org",
        "email": "test@example.com"
    }

    dept_id = str(uuid.uuid4())
    company_id = "test-company"

    # In main.py we have log_audit_action
    from main import log_audit_action

    await log_audit_action(db, mock_user, "CREATE", "Department", dept_id, company_id, "Test Details")

    # Check DB
    audit_docs = await db.audit_logs.find({"company_id": company_id}).to_list(10)
    assert len(audit_docs) == 1
    assert audit_docs[0]["action"] == "CREATE"
    assert audit_docs[0]["module"] == "Department"
    assert audit_docs[0]["entity_id"] == dept_id
