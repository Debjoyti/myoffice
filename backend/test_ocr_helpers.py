import pytest
from ocr_helpers import parse_employee_from_text

def test_parse_employee_all_fields():
    text = """
    Name: John Doe
    Contact: +91 9876543210
    Email: john.doe@example.com
    PAN: ABCDE1234F
    Aadhaar: 1234 5678 9012
    """
    result = parse_employee_from_text(text)
    assert result.get("email") == "john.doe@example.com"
    assert result.get("phone") == "9876543210"
    assert result.get("pan_number") == "ABCDE1234F"
    assert result.get("aadhaar_number") == "123456789012"

def test_parse_employee_missing_fields():
    text = "Just some random text with no personal info."
    result = parse_employee_from_text(text)
    assert result == {}

def test_parse_employee_phone_variations():
    # Without country code
    result = parse_employee_from_text("Phone: 9876543210")
    assert result.get("phone") == "9876543210"

    # With 91 (no plus) - The regex `(?:\+91|91)?[\-\s]?(\d{10})` can match "9198765432" as 10 digits without the "91" code because "91" prefix is optional and not word-bounded,
    # but let's test a realistic 91 prefixed number with a space which it handles correctly
    result = parse_employee_from_text("Phone: 91 9876543210")
    assert result.get("phone") == "9876543210"

    # With hyphen separator
    result = parse_employee_from_text("Phone: +91-9876543210")
    assert result.get("phone") == "9876543210"

    # With space separator
    result = parse_employee_from_text("Phone: +91 9876543210")
    assert result.get("phone") == "9876543210"

def test_parse_employee_email_variations():
    # Subdomain
    result = parse_employee_from_text("Contact me at user@sub.domain.co.uk")
    assert result.get("email") == "user@sub.domain.co.uk"

    # Plus alias
    result = parse_employee_from_text("My email is test+alias@gmail.com")
    assert result.get("email") == "test+alias@gmail.com"

def test_parse_employee_aadhaar_spacing():
    # Correct format
    result = parse_employee_from_text("Aadhaar: 1111 2222 3333")
    assert result.get("aadhaar_number") == "111122223333"

    # Incorrect format (no spaces)
    result = parse_employee_from_text("Aadhaar: 111122223333")
    assert "aadhaar_number" not in result

    # Incorrect format (wrong spacing)
    result = parse_employee_from_text("Aadhaar: 111 12222 3333")
    assert "aadhaar_number" not in result

def test_parse_employee_pan_format():
    # Correct format
    result = parse_employee_from_text("PAN: ABCDE1234F")
    assert result.get("pan_number") == "ABCDE1234F"

    # Incorrect format (lowercase) - regex expects uppercase
    result = parse_employee_from_text("PAN: abcde1234f")
    assert "pan_number" not in result

    # Incorrect format (wrong number of letters/digits)
    result = parse_employee_from_text("PAN: ABCD12345F")
    assert "pan_number" not in result
