import pytest
from whatsapp_classifier import WhatsAppClassifier

@pytest.fixture
def classifier():
    return WhatsAppClassifier()

def test_classify_approve_exact(classifier):
    res = classifier.classify_intent("approve")
    assert res["action"] == "approve"
    assert res["confidence"] == 0.95

def test_classify_approve_phrase(classifier):
    res = classifier.classify_intent("looks good")
    assert res["action"] == "approve"
    assert res["confidence"] == 0.95

def test_classify_approve_partial(classifier):
    res = classifier.classify_intent("Yes, please approve this")
    assert res["action"] == "approve"
    assert res["confidence"] == 0.86

def test_classify_reject(classifier):
    res = classifier.classify_intent("reject")
    assert res["action"] == "reject"
    assert res["confidence"] == 0.95

def test_classify_remind_later(classifier):
    res = classifier.classify_intent("remind me later")
    assert res["action"] == "remind_later"
    assert res["confidence"] == 0.86

def test_classify_show_details(classifier):
    res = classifier.classify_intent("show more info")
    assert res["action"] == "show_details"
    assert res["confidence"] == 0.86

def test_classify_who_pending(classifier):
    res = classifier.classify_intent("who is pending?")
    assert res["action"] == "who_pending"
    assert res["confidence"] == 0.86

def test_classify_cash_position(classifier):
    res = classifier.classify_intent("what is our cash position")
    assert res["action"] == "cash_position"
    assert res["confidence"] == 0.86

def test_classify_today_collections(classifier):
    res = classifier.classify_intent("collections today")
    assert res["action"] == "today_collections"
    assert res["confidence"] == 0.86

def test_classify_unknown_gibberish(classifier):
    res = classifier.classify_intent("qwertyuiop")
    assert res["action"] == "unknown"
    assert res["confidence"] == 0.0

def test_classify_unknown_near_miss(classifier):
    res = classifier.classify_intent("approv")
    assert res["action"] == "unknown"
    assert res["confidence"] == 0.0

def test_classify_unknown_empty(classifier):
    res = classifier.classify_intent("")
    assert res["action"] == "unknown"
    assert res["confidence"] == 0.0

def test_classify_unknown_whitespace(classifier):
    res = classifier.classify_intent("   ")
    assert res["action"] == "unknown"
    assert res["confidence"] == 0.0

def test_classify_case_insensitive(classifier):
    res = classifier.classify_intent("APPROVE")
    assert res["action"] == "approve"
    assert res["confidence"] == 0.95

def test_classify_strip_whitespace(classifier):
    res = classifier.classify_intent("  yes  ")
    assert res["action"] == "approve"
    assert res["confidence"] == 0.95
