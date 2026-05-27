from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import uuid
from fastapi import Request
from datetime import datetime, timezone



router = APIRouter(prefix="/screening", tags=["AI Screening"])

class ScreenRequest(BaseModel):
    job_id: str
    company_id: str

def mock_claude_resume_screening(resume_text: str, rubric: dict) -> dict:
    """Mocks Claude evaluating a resume against a rubric."""
    score = 0
    rationale = []

    resume_lower = resume_text.lower()

    # Very basic mock logic
    for skill in rubric.get("skills", []):
        if skill.lower() in resume_lower:
            score += 20
            rationale.append(f"Found required skill: {skill} (+20)")
        else:
            rationale.append(f"Missing skill: {skill} (-0)")

    if score == 0:
        # Give them some base score if they have text
        if len(resume_text) > 10:
            score = 30
            rationale.append("Basic resume layout points (+30)")

    # Cap score
    score = min(score, 100)

    return {
        "score": score,
        "rationale": "\n".join(rationale)
    }

@router.post("/run")
async def run_screening(data: ScreenRequest, request: Request):
    """
    Runs AI screening for all 'applied' status applications for a job.
    """
    job = await request.app.state.db.jobs.find_one({"id": data.job_id})
    if not job:
        raise HTTPException(404, "Job not found")

    rubric = job.get("rubric", {})

    # Get applications
    apps = await request.app.state.db.applications.find({"job_id": data.job_id, "status": "applied"}).to_list(100)

    screened_count = 0
    for app in apps:
        resume_text = app.get("resume_text", "")
        if not resume_text:
            continue

        evaluation = mock_claude_resume_screening(resume_text, rubric)

        await request.app.state.db.applications.update_one(
            {"id": app["id"]},
            {"$set": {
                "ai_screening_score": evaluation["score"],
                "ai_screening_rationale": evaluation["rationale"],
                "status": "screened"
            }}
        )
        screened_count += 1

    return {"status": "success", "message": f"Screened {screened_count} applications"}

@router.get("/top/{job_id}")
async def get_top_candidates(job_id: str, request: Request):
    """Returns top 5 ranked candidates for a job."""
    apps = await request.app.state.db.applications.find({"job_id": job_id}).to_list(100)

    # Sort by score descending
    sorted_apps = sorted(apps, key=lambda x: x.get("ai_screening_score", 0), reverse=True)
    top_5 = sorted_apps[:5]

    # Enrich with person info
    result = []
    for app in top_5:
        person = await request.app.state.db.persons.find_one({"id": app["person_id"]})
        result.append({
            "application_id": app["id"],
            "person_id": app["person_id"],
            "name": f"{person.get('first_name')} {person.get('last_name')}" if person else "Unknown",
            "score": app.get("ai_screening_score", 0),
            "rationale": app.get("ai_screening_rationale", "")
        })

    return result
