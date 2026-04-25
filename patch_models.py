import sys

filepath = 'backend/main.py'
with open(filepath, 'r') as f:
    content = f.read()

# Add JDCreate schema
schema_addition = """
class JobPostingCreate(BaseModel):
    title: str
    department: str
    location: str
    type: str
    description: str

class JDCreate(BaseModel):
    jd_text: str
    organization_id: Optional[str] = "default_org"

class Candidate(BaseModel):
"""
content = content.replace("class JobPostingCreate(BaseModel):\n    title: str\n    department: str\n    location: str\n    type: str\n    description: str\n\nclass Candidate(BaseModel):", schema_addition)


# Add the create-from-jd endpoint
endpoint_addition = """
# --- Careers Endpoints ---
@app.post("/api/careers/jobs/create-from-jd")
async def create_job_from_jd(payload: JDCreate):
    from ai_recruitment import parse_jd
    parsed_data = parse_jd(payload.jd_text)

    # Generate a title heuristic
    lines = payload.jd_text.strip().split("\\n")
    title = lines[0] if len(lines[0]) < 50 else "New AI Role"

    skills_str = ", ".join([s["name"] for s in parsed_data["parsed_skills"]])

    import uuid
    job_id = str(uuid.uuid4())
    job_doc = {
        "id": job_id,
        "title": title,
        "department": "Engineering",
        "location": "Remote",
        "type": "Full-time",
        "description": payload.jd_text,
        "skills_required": skills_str,
        "parsed_skills": parsed_data["parsed_skills"],
        "experience_level": parsed_data["experience_level"],
        "status": "open",
        "organization_id": payload.organization_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.jobs.insert_one(job_doc)
    return {"message": "Job created autonomously via AI", "job_id": job_id, "parsed_data": parsed_data}

@app.get("/api/careers/jobs")
"""
content = content.replace("# --- Careers Endpoints ---\n@app.get(\"/api/careers/jobs\")", endpoint_addition)

with open(filepath, 'w') as f:
    f.write(content)

print("Models and endpoints updated.")
