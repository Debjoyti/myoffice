import pytest
from datetime import datetime, timezone
import uuid
from fallback_db import InMemoryDatabase
from auto_gl import create_auto_journal_entry, _get_or_create_system_account

@pytest.fixture
def db():
    return InMemoryDatabase()

@pytest.mark.asyncio
async def test_create_auto_journal_entry_balanced(db):
    company_id = "test_company"
    account1 = await _get_or_create_system_account(db, company_id, "1001", "Cash", "Asset", "Current Asset")
    account2 = await _get_or_create_system_account(db, company_id, "4001", "Sales", "Revenue", "Operating Revenue")

    # Set initial balances
    await db.chart_of_accounts.update_one({"id": account1["id"]}, {"$set": {"current_balance": 100.0}})
    await db.chart_of_accounts.update_one({"id": account2["id"]}, {"$set": {"current_balance": 0.0}})

    lines = [
        {"account_id": account1["id"], "debit": 50.0, "credit": 0.0},
        {"account_id": account2["id"], "debit": 0.0, "credit": 50.0}
    ]

    date_str = datetime.now(timezone.utc).isoformat()
    entry = await create_auto_journal_entry(
        db, company_id, date_str, "Test Narration", "Test Ref", lines
    )

    assert entry is not None
    assert entry["total_debit"] == 50.0
    assert entry["total_credit"] == 50.0
    assert entry["entry_number"] == "JE-00001"

    # Verify journal entry was inserted
    stored_entry = await db.journal_entries.find_one({"id": entry["id"]})
    assert stored_entry is not None
    assert stored_entry["total_debit"] == 50.0

    # Verify chart of accounts balance update
    acc1_updated = await db.chart_of_accounts.find_one({"id": account1["id"]})
    assert acc1_updated["current_balance"] == 150.0  # 100 + 50 debit - 0 credit

    acc2_updated = await db.chart_of_accounts.find_one({"id": account2["id"]})
    assert acc2_updated["current_balance"] == -50.0  # 0 + 0 debit - 50 credit

    # Verify counter update
    counter = await db.counters.find_one({"_id": f"journal_{company_id}"})
    assert counter["seq"] == 1

@pytest.mark.asyncio
async def test_create_auto_journal_entry_unbalanced(db):
    company_id = "test_company"
    account1 = await _get_or_create_system_account(db, company_id, "1001", "Cash", "Asset", "Current Asset")
    account2 = await _get_or_create_system_account(db, company_id, "4001", "Sales", "Revenue", "Operating Revenue")

    lines = [
        {"account_id": account1["id"], "debit": 60.0, "credit": 0.0},
        {"account_id": account2["id"], "debit": 0.0, "credit": 50.0}
    ]

    date_str = datetime.now(timezone.utc).isoformat()
    entry = await create_auto_journal_entry(
        db, company_id, date_str, "Test Narration", "Test Ref", lines
    )

    assert entry is None

    # Verify nothing was inserted
    entries_count = await db.journal_entries.count_documents({})
    assert entries_count == 0

@pytest.mark.asyncio
async def test_create_auto_journal_entry_empty_lines(db):
    company_id = "test_company"
    lines = []

    date_str = datetime.now(timezone.utc).isoformat()
    entry = await create_auto_journal_entry(
        db, company_id, date_str, "Test Narration", "Test Ref", lines
    )

    assert entry is None

    entries_count = await db.journal_entries.count_documents({})
    assert entries_count == 0
