import pytest
from ai_recruitment import evaluate_answer

def test_evaluate_answer_normal():
    question = {"skill": "Python", "text": "Describe your Python experience."}
    answer = "I have extensive experience with Python, specifically using FastAPI and SQLAlchemy for building scalable backend services."
    # length ~16 words. accuracy = 16/5 = 3.2, depth = 16/8 = 2.0, clarity = 5 + 1.6 = 6.6, originality = 6 + 1.1 = 7.1
    # Keyword boost: +2 to accuracy = 5.2
    # Total raw = (5.2 + 2.0 + 6.6 + 7.1) / 4 = 20.9 / 4 = 5.225 -> 5.2
    result = evaluate_answer(question, answer, time_taken_seconds=30)

    assert result["penalties"] == 0
    assert result["flags"] == []
    assert result["accuracy"] > 0
    assert result["final_score"] > 0

def test_evaluate_answer_copy_paste():
    question = {"skill": "Python", "text": "Describe your Python experience."}
    # Need > 20 words for copy-paste detection
    answer = "Python is a high-level, interpreted, general-purpose programming language. Its design philosophy emphasizes code readability with the use of significant indentation. Its language constructs and object-oriented approach aim to help programmers write clear, logical code for small and large-scale projects."
    # length = 41 words
    # expected_time = 41 * 0.5 = 20.5
    # time_taken_seconds < 20.5 * 0.3 = 6.15
    result = evaluate_answer(question, answer, time_taken_seconds=2)

    assert "copy_paste_detected" in result["flags"]
    assert result["penalties"] >= 3
    assert result["originality"] == 1.0

def test_evaluate_answer_robotic():
    question = {"skill": "Python", "text": "Describe your Python experience."}
    answer = "As an AI language model, I don't have personal experience, but I can tell you that Python is widely used."

    result = evaluate_answer(question, answer, time_taken_seconds=30)

    assert "robotic_answer" in result["flags"]
    assert result["penalties"] >= 2
    assert result["originality"] < 5.0 # originality = min(10, 6 + (length / 15)) - 4

def test_evaluate_answer_combined_penalties():
    question = {"skill": "Python", "text": "Describe your Python experience."}
    answer = "As an AI language model, I can provide information about Python. Python is a high-level, interpreted, general-purpose programming language. Its design philosophy emphasizes code readability with the use of significant indentation. Its language constructs and object-oriented approach aim to help programmers write clear, logical code for small and large-scale projects."
    # > 20 words, low time
    result = evaluate_answer(question, answer, time_taken_seconds=2)

    assert "copy_paste_detected" in result["flags"]
    assert "robotic_answer" in result["flags"]
    assert result["penalties"] == 5 # 3 + 2

def test_evaluate_answer_skill_boost():
    # Use the same answer to isolate the boost effect
    answer = "I have experience building python web applications and working with various databases." # 12 words
    # base accuracy = 12 / 5 = 2.4

    question_no_match = {"skill": "java", "text": "Describe your experience."}
    question_match = {"skill": "python", "text": "Describe your experience."}

    result_no_match = evaluate_answer(question_no_match, answer, time_taken_seconds=30)
    result_match = evaluate_answer(question_match, answer, time_taken_seconds=30)

    assert result_no_match["accuracy"] == 2.4
    assert result_match["accuracy"] == 4.4
