import pytest
from jose import jwt
from datetime import datetime, timezone, timedelta
from main import create_access_token, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

def test_create_access_token_success():
    data = {"sub": "test-user-id", "role": "admin"}
    token = create_access_token(data)

    assert isinstance(token, str)

    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

    assert payload["sub"] == data["sub"]
    assert payload["role"] == data["role"]
    assert "exp" in payload

def test_create_access_token_expiration():
    data = {"sub": "test-user-id"}
    token = create_access_token(data)

    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    exp = payload["exp"]

    # Check if expiration is roughly 24 hours (1440 minutes) from now
    # Line 219 in main.py: expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    expected_exp = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    # Allow for some small time difference (60 seconds)
    assert abs(exp - int(expected_exp.timestamp())) < 60
