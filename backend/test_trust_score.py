import pytest
import sys
import os

with open('api/trust_backbone.py') as f:
    code = f.read()

env = {}
exec(code, env)
compute_trust_score = env['compute_trust_score']

def test_compute_trust_score():
    verifs = [
        {"type": "digilocker", "status": "verified"},
        {"type": "uan", "status": "verified"},
        {"type": "pan", "status": "failed"},
    ]

    result = compute_trust_score(verifs)
    assert result["score"] == 55
    assert "digilocker" in result["breakdown"]
    assert "uan" in result["breakdown"]
    assert "pan" not in result["breakdown"]
