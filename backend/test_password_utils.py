import pytest
from main import get_password_hash, verify_password

def test_verify_password_success():
    password = "strongpassword123"
    hashed = get_password_hash(password)
    assert verify_password(password, hashed) is True

def test_verify_password_failure():
    password = "strongpassword123"
    wrong_password = "wrongpassword123"
    hashed = get_password_hash(password)
    assert verify_password(wrong_password, hashed) is False

def test_get_password_hash_salting():
    password = "strongpassword123"
    hashed1 = get_password_hash(password)
    hashed2 = get_password_hash(password)
    # passlib bcrypt should generate different hashes for the same password due to salting
    assert hashed1 != hashed2
    # But both should be valid
    assert verify_password(password, hashed1) is True
    assert verify_password(password, hashed2) is True

def test_verify_password_empty():
    assert verify_password("", get_password_hash("")) is True
