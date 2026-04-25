import re
import pytesseract
from PIL import Image
from pdf2image import convert_from_bytes

def extract_text_from_file(file_content, filename):
    text = ""
    try:
        if filename.lower().endswith(".pdf"):
            images = convert_from_bytes(file_content)
            for img in images:
                text += pytesseract.image_to_string(img) + "\n"
        else:
            import io
            image = Image.open(io.BytesIO(file_content))
            text = pytesseract.image_to_string(image)
    except Exception as e:
        print(f"Error during OCR extraction: {e}")
    return text

def parse_employee_from_text(text):
    data = {}

    # Email
    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    if email_match:
        data["email"] = email_match.group(0)

    # Phone
    phone_match = re.search(r'(?:\+91|91)?[\-\s]?(\d{10})', text)
    if phone_match:
        data["phone"] = phone_match.group(1)

    # PAN Number
    pan_match = re.search(r'[A-Z]{5}[0-9]{4}[A-Z]{1}', text)
    if pan_match:
        data["pan_number"] = pan_match.group(0)

    # Aadhaar Number
    aadhaar_match = re.search(r'\b\d{4}\s\d{4}\s\d{4}\b', text)
    if aadhaar_match:
        data["aadhaar_number"] = aadhaar_match.group(0).replace(" ", "")

    return data
