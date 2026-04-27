import sys

try:
    from pydantic import Field
    print("Field is imported successfully.")
except Exception as e:
    print("Error:", e)
