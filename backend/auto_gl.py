import uuid
from datetime import datetime, timezone

async def _get_or_create_system_account(db, company_id: str, code: str, name: str, account_type: str, sub_type: str):
    account = await db.chart_of_accounts.find_one({"company_id": company_id, "code": code})
    if not account:
        account_id = str(uuid.uuid4())
        account = {
            "id": account_id,
            "company_id": company_id,
            "code": code,
            "name": name,
            "type": account_type,
            "sub_type": sub_type,
            "current_balance": 0.0,
            "currency": "INR",
            "is_bank": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.chart_of_accounts.insert_one({k: v for k, v in account.items() if k != "_id"})
    return account

async def create_auto_journal_entry(db, company_id: str, date: str, narration: str, reference: str, lines: list, created_by: str = "System"):
    total_debit = sum(l.get("debit", 0.0) for l in lines)
    total_credit = sum(l.get("credit", 0.0) for l in lines)

    if abs(total_debit - total_credit) > 0.01:
        # Ignore for now or log error
        print(f"Auto GL Entry failed: debits={total_debit:.2f}, credits={total_credit:.2f}")
        return None

    if not lines:
        return None

    counter_result = await db.counters.find_one_and_update(
        {"_id": f"journal_{company_id}"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    seq_num = counter_result["seq"]

    entry = {
        "id": str(uuid.uuid4()),
        "company_id": company_id,
        "entry_number": f"JE-{seq_num:05d}",
        "total_debit": round(total_debit, 2),
        "total_credit": round(total_credit, 2),
        "status": "posted",
        "created_by": created_by,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "date": date,
        "narration": narration,
        "reference": reference,
        "lines": lines
    }
    await db.journal_entries.insert_one({k: v for k, v in entry.items() if k != "_id"})

    for line in lines:
        await db.chart_of_accounts.update_one(
            {"id": line["account_id"], "company_id": company_id},
            {"$inc": {"current_balance": line.get("debit", 0.0) - line.get("credit", 0.0)}}
        )
    return entry
