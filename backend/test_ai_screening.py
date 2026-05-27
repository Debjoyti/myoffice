import pytest
import sys
import os

with open('api/ai_screening.py') as f:
    code = f.read()

# Exec the file into a dict to get the function without importing fastapi routers
env = {}
exec(code, env)
mock_claude_resume_screening = env['mock_claude_resume_screening']

def test_mock_claude_resume_screening():
    resume_text = "I have 4 years of experience with Python and Postgres."
    rubric = {"skills": ["Python", "Postgres", "AWS"]}

    result = mock_claude_resume_screening(resume_text, rubric)

    assert "score" in result
    assert "rationale" in result
    assert result["score"] == 40
    assert "Found required skill: Python" in result["rationale"]
    assert "Found required skill: Postgres" in result["rationale"]
    assert "Missing skill: AWS" in result["rationale"]
