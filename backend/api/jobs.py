from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
import uuid
from fastapi import Request
from datetime import datetime, timezone
import random

# We will need to import db and get_current_user from main
# But to avoid circular imports, we might need to structure it carefully.
# For now, we will assume we can import from main


router = APIRouter(prefix="/jobs", tags=["Jobs"])

class JobBrief(BaseModel):
    brief: str
    company_id: str

class JobResponse(BaseModel):
    id: str
    company_id: str
    title: str
    department: Optional[str] = None
    description: str
    rubric: dict
    salary_band: dict
    status: str
    created_at: str
    updated_at: str

def mock_claude_jd_generation(brief: str) -> dict:
    """Mocks Claude Sonnet 4.6 JD and Rubric Generation."""
    # Simple heuristic-based mock for testing Magic Moment 1
    title = "Backend Engineer"
    department = "Engineering"
    if "frontend" in brief.lower():
        title = "Frontend Engineer"
    elif "sales" in brief.lower():
        title = "Sales Executive"
        department = "Sales"

    return {
        "title": title,
        "department": department,
        "description": f"Generated Job Description based on brief: '{brief}'. We are looking for an experienced {title} to join our team...",
        "rubric": {
            "skills": ["Python", "Postgres", "FastAPI"],
            "experience": "3-5 years",
            "communication": "Clear and concise"
        },
        "salary_band": {
            "min": 1500000,
            "max": 3500000,
            "currency": "INR"
        }
    }

@router.post("/draft", response_model=JobResponse)
async def draft_job(data: JobBrief, request: Request):
    # 1. Simulate AI Generation
    generated = mock_claude_jd_generation(data.brief)

    # 2. Create Job Record
    now = datetime.now(timezone.utc).isoformat()
    job_id = str(uuid.uuid4())

    job_doc = {
        "id": job_id,
        "company_id": data.company_id,
        "title": generated["title"],
        "department": generated["department"],
        "description": generated["description"],
        "rubric": generated["rubric"],
        "salary_band": generated["salary_band"],
        "status": "draft",
        "created_at": now,
        "updated_at": now
    }

    await request.app.state.db.jobs.insert_one(job_doc)

    return job_doc

@router.get("/", response_model=List[JobResponse])
async def list_jobs(company_id: str, request: Request):
    # In a real PostgreSQL app with Row-Level Security, we wouldn't even need
    # to pass company_id, the token's company_id would enforce it automatically.
    # Here we simulate this with a MongoDB query filter.
    jobs = await request.app.state.db.jobs.find({"company_id": company_id}, {"_id": 0}).to_list(100)
    return jobs
