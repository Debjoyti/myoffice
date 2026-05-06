import pytest
from typing import Any, Dict
from fallback_db import (
    _matches,
    _get_value,
    _set_value,
    _apply_projection,
    _apply_update,
    _apply_group
)

def test_get_value_basic():
    doc = {"a": 1, "b": {"c": 2}}
    assert _get_value(doc, "a") == 1
    assert _get_value(doc, "b.c") == 2
    assert _get_value(doc, "d") is None
    assert _get_value(doc, "b.d") is None
    assert _get_value(doc, "a.b") is None

def test_set_value_basic():
    doc = {}
    _set_value(doc, "a", 1)
    assert doc["a"] == 1
    _set_value(doc, "b.c", 2)
    assert doc["b"]["c"] == 2
    _set_value(doc, "b.d", 3)
    assert doc["b"]["d"] == 3
    _set_value(doc, "x.y.z", 4)
    assert doc["x"]["y"]["z"] == 4

def test_matches_basic():
    doc = {"name": "Alice", "age": 30, "dept": "HR"}
    assert _matches(doc, {}) is True
    assert _matches(doc, {"name": "Alice"}) is True
    assert _matches(doc, {"name": "Bob"}) is False
    assert _matches(doc, {"name": "Alice", "age": 30}) is True
    assert _matches(doc, {"name": "Alice", "age": 25}) is False

def test_matches_nested():
    doc = {"user": {"profile": {"name": "Alice"}}}
    assert _matches(doc, {"user.profile.name": "Alice"}) is True
    assert _matches(doc, {"user.profile.name": "Bob"}) is False

def test_matches_logical():
    doc = {"a": 1, "b": 2}
    assert _matches(doc, {"$and": [{"a": 1}, {"b": 2}]}) is True
    assert _matches(doc, {"$and": [{"a": 1}, {"b": 3}]}) is False
    assert _matches(doc, {"$or": [{"a": 1}, {"b": 3}]}) is True
    assert _matches(doc, {"$or": [{"a": 2}, {"b": 3}]}) is False

def test_matches_comparison():
    doc = {"age": 30}
    assert _matches(doc, {"age": {"$gt": 25}}) is True
    assert _matches(doc, {"age": {"$gt": 30}}) is False
    assert _matches(doc, {"age": {"$gte": 30}}) is True
    assert _matches(doc, {"age": {"$lt": 35}}) is True
    assert _matches(doc, {"age": {"$lte": 30}}) is True
    assert _matches(doc, {"age": {"$ne": 25}}) is True
    assert _matches(doc, {"age": {"$ne": 30}}) is False
    assert _matches(doc, {"age": {"$eq": 30}}) is True
    assert _matches(doc, {"age": {"$in": [20, 30, 40]}}) is True
    assert _matches(doc, {"age": {"$in": [20, 40]}}) is False

def test_matches_edge_cases():
    doc = {"a": None}
    assert _matches(doc, {"a": None}) is True
    assert _matches(doc, {"a": {"$gt": 10}}) is False
    assert _matches(doc, {"b": {"$gt": 10}}) is False

def test_apply_projection():
    doc = {"a": 1, "b": 2, "c": 3}
    # Inclusive
    assert _apply_projection(doc, {"a": 1, "c": 1}) == {"a": 1, "c": 3}
    # Exclusive
    assert _apply_projection(doc, {"b": 0}) == {"a": 1, "c": 3}
    # None
    assert _apply_projection(doc, None) == doc

def test_apply_update():
    doc = {"a": 1, "b": {"c": 2}}
    update = {"$set": {"a": 10, "b.d": 3}, "$inc": {"b.c": 5, "e": 1}}
    updated = _apply_update(doc, update)
    assert updated["a"] == 10
    assert updated["b"]["c"] == 7
    assert updated["b"]["d"] == 3
    assert updated["e"] == 1
    # Original doc should not be modified
    assert doc["a"] == 1

def test_apply_group():
    docs = [
        {"dept": "HR", "salary": 1000},
        {"dept": "HR", "salary": 1500},
        {"dept": "Eng", "salary": 2000},
    ]
    spec = {
        "_id": "$dept",
        "total_salary": {"$sum": "$salary"},
        "count": {"$sum": 1}
    }
    result = _apply_group(docs, spec)
    assert len(result) == 2
    hr = next(r for r in result if r["_id"] == "HR")
    eng = next(r for r in result if r["_id"] == "Eng")
    assert hr["total_salary"] == 2500
    assert hr["count"] == 2
    assert eng["total_salary"] == 2000
    assert eng["count"] == 1
