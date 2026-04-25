import re
import math
import random
from typing import Dict, List, Any

def parse_jd(jd_text: str) -> Dict[str, Any]:
    """
    Parses a Job Description to extract skills, weightage, and difficulty level.
    Provides a mock heuristic implementation.
    """
    jd_lower = jd_text.lower()

    # Heuristic skill extraction based on common keywords
    possible_skills = ["python", "java", "react", "fastapi", "sql", "aws", "system design", "communication", "leadership", "apis"]

    found_skills = []
    for skill in possible_skills:
        if skill in jd_lower:
            found_skills.append(skill)

    # Default if none found
    if not found_skills:
        found_skills = ["general engineering", "problem solving", "communication"]

    # Assign weightages and difficulties
    skills = []
    total_weight = 0
    for i, skill in enumerate(found_skills):
        # simple heuristic for weight
        weight = 100 // len(found_skills)
        difficulty = "medium"
        if "senior" in jd_lower or "expert" in jd_lower:
            difficulty = "hard"
        elif "junior" in jd_lower or "entry" in jd_lower:
            difficulty = "easy"

        skills.append({
            "name": skill,
            "weightage": weight, # percentage
            "difficulty": difficulty
        })
        total_weight += weight

    # Fix rounding issues
    if skills and total_weight < 100:
        skills[0]["weightage"] += (100 - total_weight)

    return {
        "parsed_skills": skills,
        "experience_level": "senior" if "senior" in jd_lower else ("junior" if "junior" in jd_lower else "mid"),
        "raw_text": jd_text
    }


def analyze_resume(resume_text: str, jd_skills: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyzes a candidate's resume against JD skills.
    Identifies strengths, gaps, and mismatches.
    """
    resume_lower = resume_text.lower()

    strengths = []
    gaps = []
    mismatches = []

    for jd_skill in jd_skills:
        skill_name = jd_skill["name"]
        if skill_name in resume_lower:
            strengths.append(skill_name)
        else:
            gaps.append(skill_name)

    # A simple mock heuristic for mismatches
    if "python" in [s["name"] for s in jd_skills] and "java" in resume_lower and "python" not in resume_lower:
        mismatches.append("Strong Java experience but missing required Python")

    return {
        "strengths": strengths,
        "gaps": gaps,
        "mismatches": mismatches,
        "match_score": (len(strengths) / len(jd_skills)) * 100 if jd_skills else 0
    }


def generate_interview_questions(jd_skills: List[Dict[str, Any]], resume_analysis: Dict[str, Any], round_num: int = 1) -> Dict[str, Any]:
    """
    Generates dynamic interview questions using the 40-30-30 rule.
    (40% JD based, 30% resume based, 30% verification)
    """
    questions = []

    # 1. JD Based (40%)
    jd_pool = [s["name"] for s in jd_skills]
    if jd_pool:
        skill = random.choice(jd_pool)
        questions.append({
            "type": "jd",
            "skill": skill,
            "text": f"Can you describe your experience working with {skill} and how you've applied it in production?",
            "expected_depth": "medium"
        })

    # 2. Resume Based (30%)
    strengths = resume_analysis.get("strengths", [])
    if strengths:
        strength = random.choice(strengths)
        questions.append({
            "type": "resume",
            "skill": strength,
            "text": f"Your resume mentions experience with {strength}. Can you walk me through a specific challenging project where you used this?",
            "expected_depth": "high"
        })
    else:
        # Fallback
        questions.append({
            "type": "resume",
            "skill": "general",
            "text": "Can you walk me through your most significant professional achievement?",
            "expected_depth": "high"
        })

    # 3. Verification (30%)
    gaps = resume_analysis.get("gaps", [])
    if gaps:
        gap = random.choice(gaps)
        questions.append({
            "type": "verification",
            "skill": gap,
            "text": f"We require {gap} for this role, but it's not prominent on your resume. How would you approach learning or applying this?",
            "expected_depth": "medium"
        })
    else:
        # Deep dive to verify claims
        skill = random.choice(jd_pool) if jd_pool else "problem solving"
        questions.append({
            "type": "verification",
            "skill": skill,
            "text": f"To verify your expertise in {skill}, what is the most complex bug you've had to fix related to this, and how did you do it?",
            "expected_depth": "high"
        })

    return {
        "questions": questions,
        "round": round_num
    }


def evaluate_answer(question: Dict[str, Any], answer_text: str, time_taken_seconds: int = 30) -> Dict[str, Any]:
    """
    Evaluates an answer and scores on:
    - Accuracy, Depth, Clarity, Originality (0-10)
    Applies penalties for cheating (copy/paste detection, robotic answers).
    """
    ans_lower = answer_text.lower()
    length = len(ans_lower.split())

    # Base scores heuristic based on length and keywords
    accuracy = min(10, length / 5)
    depth = min(10, length / 8)
    clarity = min(10, 5 + (length / 10))
    originality = min(10, 6 + (length / 15))

    # Keyword boosts
    if question.get("skill", "") in ans_lower:
        accuracy = min(10, accuracy + 2)

    # Anti-cheating logic
    penalties = 0
    flags = []

    # 1. Copy Detection (Heuristic: Too fast for the length)
    # Average typing speed is ~40 words per minute (0.66 words per sec).
    # If time taken is absurdly low for the length, flag as copy paste.
    expected_time = length * 0.5 # optimistic typing speed
    if time_taken_seconds > 0 and time_taken_seconds < (expected_time * 0.3) and length > 20:
        flags.append("copy_paste_detected")
        penalties += 3
        originality = 1

    # 2. Humanization Check (Robotic)
    robotic_phrases = ["as an ai language model", "it is important to note", "in conclusion"]
    if any(phrase in ans_lower for phrase in robotic_phrases):
        flags.append("robotic_answer")
        penalties += 2
        clarity = max(0, clarity - 2)
        originality = max(0, originality - 4)

    # Calculate aggregate
    raw_score = (accuracy + depth + clarity + originality) / 4
    final_score = max(0.0, raw_score - penalties)

    return {
        "accuracy": round(accuracy, 1),
        "depth": round(depth, 1),
        "clarity": round(clarity, 1),
        "originality": round(originality, 1),
        "penalties": penalties,
        "flags": flags,
        "final_score": round(final_score, 1)
    }
