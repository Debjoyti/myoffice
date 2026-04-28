import sys
import os

# Add backend directory to sys.path to be able to import backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from ai_recruitment import parse_jd

def test_parse_jd_skill_extraction():
    jd_text = "We are looking for someone with experience in Python, AWS, and React."
    result = parse_jd(jd_text)

    parsed_skills = [s["name"] for s in result["parsed_skills"]]
    assert "python" in parsed_skills
    assert "aws" in parsed_skills
    assert "react" in parsed_skills
    assert "java" not in parsed_skills
    assert result["raw_text"] == jd_text

def test_parse_jd_no_skills_fallback():
    jd_text = "We need a smart person who can code well."
    result = parse_jd(jd_text)

    parsed_skills = [s["name"] for s in result["parsed_skills"]]
    assert "general engineering" in parsed_skills
    assert "problem solving" in parsed_skills
    assert "communication" in parsed_skills

def test_parse_jd_experience_level_senior():
    jd_text = "Senior Software Engineer needed. Must have Python."
    result = parse_jd(jd_text)

    assert result["experience_level"] == "senior"
    for skill in result["parsed_skills"]:
        assert skill["difficulty"] == "hard"

def test_parse_jd_experience_level_junior():
    jd_text = "Junior developer with basic React skills."
    result = parse_jd(jd_text)

    assert result["experience_level"] == "junior"
    for skill in result["parsed_skills"]:
        assert skill["difficulty"] == "easy"

def test_parse_jd_experience_level_expert():
    jd_text = "We need an expert in AWS."
    result = parse_jd(jd_text)

    # "expert" doesn't change experience_level (only senior/junior do based on logic), but it does change difficulty
    assert result["experience_level"] == "mid" # default
    for skill in result["parsed_skills"]:
        assert skill["difficulty"] == "hard"

def test_parse_jd_experience_level_entry():
    jd_text = "Entry level position."
    result = parse_jd(jd_text)

    # "entry" doesn't change experience_level, but changes difficulty to easy
    assert result["experience_level"] == "mid"
    for skill in result["parsed_skills"]:
        assert skill["difficulty"] == "easy"

def test_parse_jd_experience_level_mid():
    jd_text = "Software developer with Java."
    result = parse_jd(jd_text)

    assert result["experience_level"] == "mid"
    for skill in result["parsed_skills"]:
        assert skill["difficulty"] == "medium"

def test_parse_jd_weightage_calculation():
    jd_text = "Python, Java, React, SQL"
    result = parse_jd(jd_text)

    skills = result["parsed_skills"]
    assert len(skills) == 4

    total_weightage = sum(s["weightage"] for s in skills)
    assert total_weightage == 100

    # weightage of 1st element might have the remainder added
    # 100 // 4 = 25
    assert skills[0]["weightage"] == 25
    assert skills[1]["weightage"] == 25
    assert skills[2]["weightage"] == 25
    assert skills[3]["weightage"] == 25

def test_parse_jd_weightage_rounding():
    jd_text = "Python, Java, React"
    result = parse_jd(jd_text)

    skills = result["parsed_skills"]
    assert len(skills) == 3

    total_weightage = sum(s["weightage"] for s in skills)
    assert total_weightage == 100

    # 100 // 3 = 33
    # remainder is 1, so first element gets 33 + 1 = 34
    assert skills[0]["weightage"] == 34
    assert skills[1]["weightage"] == 33
    assert skills[2]["weightage"] == 33
