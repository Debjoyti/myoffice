from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uuid
from fastapi import Request
from datetime import datetime, timezone



router = APIRouter(prefix="/whatsapp", tags=["WhatsApp conversational app"])

class WhatsAppMessage(BaseModel):
    phone_number: str
    message: str
    job_id: str
    company_id: str

class ApplicationWeb(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    resume_text: str
    job_id: str
    company_id: str

def mock_claude_resume_extraction(resume_text: str) -> dict:
    return {
        "skills": ["Python", "Postgres", "AWS"],
        "experience_years": 4,
        "current_ctc": "2500000",
        "expected_ctc": "3200000",
        "notice_period": "30 days",
        "location": "Pune"
    }

@router.post("/webhook")
async def whatsapp_webhook(data: WhatsAppMessage, request: Request):
    """
    Simulates receiving a WhatsApp message from a candidate.
    A simple state machine will process the 'Hi', ask questions,
    and ultimately create a candidate record.
    """
    # For simulation, we assume any message other than 'Hi' contains the resume text or info.
    # We will immediately create a person and application to satisfy the flow.

    person_id = str(uuid.uuid4())
    app_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    # 1. Create or find person (mocking the extraction from WA chat)
    person_doc = {
        "id": person_id,
        "company_id": data.company_id,
        "first_name": "WA Candidate",
        "last_name": data.phone_number[-4:],
        "email": f"candidate_{data.phone_number}@example.com",
        "phone": data.phone_number,
        "status": "candidate",
        "created_at": now,
        "updated_at": now
    }

    await request.app.state.db.persons.insert_one(person_doc)

    # 2. Extract structured data
    parsed_data = mock_claude_resume_extraction(data.message)

    # 3. Create application
    app_doc = {
        "id": app_id,
        "company_id": data.company_id,
        "job_id": data.job_id,
        "person_id": person_id,
        "source": "whatsapp",
        "resume_text": data.message,
        "parsed_data": parsed_data,
        "status": "applied",
        "created_at": now,
        "updated_at": now
    }

    await request.app.state.db.applications.insert_one(app_doc)

    return {"status": "success", "message": "Application received via WhatsApp simulated webhook", "app_id": app_id}


@router.post("/web-apply")
async def web_apply(data: ApplicationWeb, request: Request):
    """
    Web fallback for 60-second application.
    """
    person_id = str(uuid.uuid4())
    app_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    person_doc = {
        "id": person_id,
        "company_id": data.company_id,
        "first_name": data.first_name,
        "last_name": data.last_name,
        "email": data.email,
        "phone": data.phone,
        "status": "candidate",
        "created_at": now,
        "updated_at": now
    }

    await request.app.state.db.persons.insert_one(person_doc)

    parsed_data = mock_claude_resume_extraction(data.resume_text)

    app_doc = {
        "id": app_id,
        "company_id": data.company_id,
        "job_id": data.job_id,
        "person_id": person_id,
        "source": "web",
        "resume_text": data.resume_text,
        "parsed_data": parsed_data,
        "status": "applied",
        "created_at": now,
        "updated_at": now
    }

    await request.app.state.db.applications.insert_one(app_doc)

    return {"status": "success", "message": "Application received via Web", "app_id": app_id}
