from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
import uuid
from fastapi import Request
from datetime import datetime, timezone



router = APIRouter(prefix="/trust", tags=["Trust Backbone"])

class VerificationRequest(BaseModel):
    person_id: str
    company_id: str
    types: List[str] # e.g. ['digilocker', 'uan', 'pan']

def mock_digilocker_api(person_id: str) -> dict:
    return {"status": "verified", "data": {"degree": "B.Tech Computer Science", "university": "IIIT-Hyderabad", "year": "2019"}}

def mock_uan_api(person_id: str) -> dict:
    return {"status": "verified", "data": {"last_employer": "Razorpay", "tenure_years": 3.2, "pf_status": "active"}}

def mock_pan_api(person_id: str) -> dict:
    return {"status": "verified", "data": {"name_match": True, "kyc_status": "valid"}}

def compute_trust_score(verifications: list) -> dict:
    """Computes a score based on verified components."""
    score = 0
    breakdown = {}

    for v in verifications:
        if v["status"] == "verified":
            if v["type"] == "digilocker":
                score += 30
                breakdown["digilocker"] = "Verified degree (+30)"
            elif v["type"] == "uan":
                score += 25
                breakdown["uan"] = "Confirmed last employer (+25)"
            elif v["type"] == "pan":
                score += 15
                breakdown["pan"] = "Identity match (+15)"
            elif v["type"] == "reference":
                score += 15
                breakdown["reference"] = "References confirmed (+15)"

    # Normalize or cap if needed
    if score > 100: score = 100

    return {"score": score, "breakdown": breakdown}

@router.post("/verify")
async def request_verification(data: VerificationRequest, request: Request):
    """
    Simulates calling external India Stack APIs to verify a candidate.
    Creates Verification records and updates the Trust Score.
    """
    now = datetime.now(timezone.utc).isoformat()
    completed_verifications = []

    for v_type in data.types:
        v_id = str(uuid.uuid4())
        result_data = {}
        status = "failed"

        # Call mock API based on type
        if v_type == "digilocker":
            res = mock_digilocker_api(data.person_id)
            result_data, status = res["data"], res["status"]
        elif v_type == "uan":
            res = mock_uan_api(data.person_id)
            result_data, status = res["data"], res["status"]
        elif v_type == "pan":
            res = mock_pan_api(data.person_id)
            result_data, status = res["data"], res["status"]

        v_doc = {
            "id": v_id,
            "company_id": data.company_id,
            "person_id": data.person_id,
            "type": v_type,
            "status": status,
            "result_data": result_data,
            "verified_at": now if status == "verified" else None,
            "created_at": now
        }
        await request.app.state.db.verifications.insert_one(v_doc)
        completed_verifications.append(v_doc)

    # Re-compute Trust Score
    all_person_verifs = await request.app.state.db.verifications.find({"person_id": data.person_id}).to_list(100)
    score_data = compute_trust_score(all_person_verifs)

    # Update or insert trust score
    ts_doc = {
        "company_id": data.company_id,
        "person_id": data.person_id,
        "score": score_data["score"],
        "breakdown": score_data["breakdown"],
        "last_computed_at": now
    }

    # Simple upsert
    existing = await request.app.state.db.trust_scores.find_one({"person_id": data.person_id})
    if existing:
        await request.app.state.db.trust_scores.update_one({"person_id": data.person_id}, {"$set": ts_doc})
    else:
        await request.app.state.db.trust_scores.insert_one(ts_doc)

    return {"status": "success", "trust_score": ts_doc}

@router.get("/{person_id}")
async def get_trust_profile(person_id: str, request: Request):
    ts = await request.app.state.db.trust_scores.find_one({"person_id": person_id}, {"_id": 0})
    verifs = await request.app.state.db.verifications.find({"person_id": person_id}, {"_id": 0}).to_list(100)

    if not ts:
        ts = {"score": 0, "breakdown": {}}

    return {"trust_score": ts, "verifications": verifs}
