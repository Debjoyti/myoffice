import pytest
from ai_expense_engine import analyze_receipt

def test_analyze_receipt_empty_string():
    result = analyze_receipt("")
    assert result == {"vendor": "Unknown Vendor", "amount": 0.0, "date": ""}

def test_analyze_receipt_basic_happy_path():
    text = """
    Acme Corp
    Some other text
    Date: 12/05/2023
    Total: Rs. 1500.50
    """
    result = analyze_receipt(text)
    assert result["vendor"] == "Acme Corp"
    assert result["amount"] == 1500.50
    assert result["date"] == "12/05/2023"

def test_analyze_receipt_dollar_with_comma():
    text = """
    Tech Store
    10-15-23
    Total: $ 1,234.56
    """
    result = analyze_receipt(text)
    assert result["vendor"] == "Tech Store"
    assert result["amount"] == 1234.56
    assert result["date"] == "10-15-23"

def test_analyze_receipt_inr_no_decimal():
    text = """
    Local Cafe
    INR 500
    25/12/2023
    """
    result = analyze_receipt(text)
    assert result["vendor"] == "Local Cafe"
    assert result["amount"] == 500.0
    assert result["date"] == "25/12/2023"

def test_analyze_receipt_rupee_symbol():
    text = """
    Restaurant
    Date: 01-01-2024
    ₹ 2,500.00
    """
    result = analyze_receipt(text)
    assert result["vendor"] == "Restaurant"
    assert result["amount"] == 2500.0
    assert result["date"] == "01-01-2024"

def test_analyze_receipt_amount_fallback():
    text = """
    Stationery Shop
    Pens and Paper
    Total 123.45
    15/08/22
    """
    result = analyze_receipt(text)
    assert result["vendor"] == "Stationery Shop"
    assert result["amount"] == 123.45
    assert result["date"] == "15/08/22"

def test_analyze_receipt_multiple_amounts_and_dates():
    text = """
    Supermarket
    Date: 10/10/2020
    Subtotal: Rs. 100.00
    Tax: Rs. 5.00
    Total: Rs. 105.00
    Next Visit: 15/10/2020
    """
    result = analyze_receipt(text)
    assert result["vendor"] == "Supermarket"
    assert result["amount"] == 105.00  # Takes the last matched amount
    assert result["date"] == "10/10/2020"  # Takes the first matched date

def test_analyze_receipt_ignore_empty_lines_for_vendor():
    text = """


    Vendor Name
    Rs. 50
    """
    result = analyze_receipt(text)
    assert result["vendor"] == "Vendor Name"
    assert result["amount"] == 50.0
    assert result["date"] == ""

def test_analyze_receipt_invalid_date_format():
    text = """
    Vendor
    Date: 2023.12.05
    Rs. 100
    """
    result = analyze_receipt(text)
    assert result["vendor"] == "Vendor"
    assert result["amount"] == 100.0
    assert result["date"] == ""  # Does not match the \b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b regex
