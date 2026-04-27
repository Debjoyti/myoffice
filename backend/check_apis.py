import sys
from pprint import pprint

with open('backend/main.py') as f:
    lines = f.readlines()

for line in lines:
    if '@api_router.' in line:
        print(line.strip())
