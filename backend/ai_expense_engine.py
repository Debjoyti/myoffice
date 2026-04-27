import re
from datetime import datetime

def analyze_receipt(text: str):
    vendor = "Unknown Vendor"
    amount = 0.0
    date = ""

    lines = [l.strip() for l in text.split('\n') if l.strip()]
    if lines:
        vendor = lines[0] # Very naive heuristic: first non-empty line is vendor

    amount_matches = re.findall(r'(?:INR|Rs\.?|\$|₹)\s*([\d,]+\.\d{2})', text, re.IGNORECASE)
    if not amount_matches:
        amount_matches = re.findall(r'(?:INR|Rs\.?|\$|₹)\s*([\d,]+)', text, re.IGNORECASE)

    if amount_matches:
        amount = float(amount_matches[-1].replace(',', ''))
    else:
        fallback = re.findall(r'\b\d+\.\d{2}\b', text)
        if fallback:
            amount = float(fallback[-1])

    date_matches = re.findall(r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b', text)
    if date_matches:
        date = date_matches[0]

    return {"vendor": vendor, "amount": amount, "date": date}

async def validate_expense_claim(db, company_id, claim_data):
    score = 10.0
    flags = []

    # 1. Category Limit Check
    category = claim_data.get("category")
    if category:
        cat_doc = await db.expense_categories.find_one({"company_id": company_id, "name": category})
        if cat_doc and claim_data["amount"] > cat_doc.get("max_limit", 999999):
            score -= 3.0
            flags.append(f"Exceeds max limit ({cat_doc['max_limit']}) for {category}")

    # 2. Duplicate Check
    query = {
        "company_id": company_id,
        "employee_id": claim_data["employee_id"],
        "amount": claim_data["amount"],
        "category": category
    }
    if "id" in claim_data:
        query["id"] = {"$ne": claim_data["id"]}

    duplicates = await db.expenses.find(query).to_list(100)
    if len(duplicates) > 0:
        score -= 5.0
        flags.append("Duplicate amount and category detected for this employee")

    # 3. Receipt vs Submission mismatch
    ai_extracted = claim_data.get("ai_extracted_data")
    if ai_extracted:
        extracted_amount = ai_extracted.get("amount", 0.0)
        if extracted_amount > 0 and abs(extracted_amount - claim_data["amount"]) > 1.0:
            score -= 4.0
            flags.append(f"Receipt amount (₹{extracted_amount}) mismatch with claim (₹{claim_data['amount']})")

    # 4. Suspicious Pattern
    if claim_data["amount"] > 1000 and claim_data["amount"] % 500 == 0 and category not in ["allowance"]:
        score -= 1.0
        flags.append("Suspicious round-number amount")

    score = max(0.0, score)
    return {"score": round(score, 1), "flags": flags}
