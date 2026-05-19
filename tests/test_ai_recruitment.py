import sys
import os

# Add backend directory to sys.path to be able to import backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from ai_recruitment import parse_jd, evaluate_answer

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

def test_evaluate_answer_happy_path():
    question = {"skill": "python", "text": "Tell me about Python."}
    answer = "I have used Python for web development and data science."
    # 10 words
    result = evaluate_answer(question, answer, time_taken_seconds=30)

    assert result["accuracy"] >= 2.0 # length based + keyword boost
    assert result["penalties"] == 0
    assert result["flags"] == []
    assert result["final_score"] > 0

def test_evaluate_answer_keyword_boost():
    question = {"skill": "react"}
    answer_with_skill = "I love React for building UIs." # 6 words
    answer_without_skill = "I love coding for building UIs." # 6 words

    res1 = evaluate_answer(question, answer_with_skill)
    res2 = evaluate_answer(question, answer_without_skill)

    # Both have 6 words. accuracy = 6/5 = 1.2
    # res1 gets boost: 1.2 + 2.0 = 3.2
    assert res1["accuracy"] == res2["accuracy"] + 2.0

def test_evaluate_answer_copy_paste():
    question = {"skill": "python"}
    # 30 words
    answer = "Python is a high-level, interpreted, general-purpose programming language. Its design philosophy emphasizes code readability with the use of significant indentation. Python is dynamically-typed and garbage-collected. It supports multiple programming paradigms."
    # length = 30 words. expected_time = 30 * 0.5 = 15. threshold = 15 * 0.3 = 4.5.
    # time_taken = 1 < 4.5
    result = evaluate_answer(question, answer, time_taken_seconds=1)

    assert "copy_paste_detected" in result["flags"]
    assert result["penalties"] == 3
    assert result["originality"] == 1

def test_evaluate_answer_robotic():
    question = {"skill": "python"}
    answer = "As an AI language model, I can tell you that Python is great."

    result = evaluate_answer(question, answer)

    assert "robotic_answer" in result["flags"]
    assert result["penalties"] == 2

def test_evaluate_answer_edge_cases():
    question = {"skill": "python"}

    # Empty answer
    # length 0 -> accuracy 0, depth 0, clarity 5, originality 6 -> raw_score 2.75 -> final 2.8
    res_empty = evaluate_answer(question, "", time_taken_seconds=30)
    assert res_empty["final_score"] == 2.8

    # Zero time taken (should NOT trigger copy paste if length <= 20)
    res_zero = evaluate_answer(question, "Short answer", time_taken_seconds=0)
    assert "copy_paste_detected" not in res_zero["flags"]
