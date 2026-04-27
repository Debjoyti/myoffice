import sys

with open('backend/main.py') as f:
    text = f.read()

models = [
    'Attendance', 'LeaveRequest', 'Task', 'Employee', 'Project'
]

for model in models:
    idx = text.find(f"class {model}(")
    if idx != -1:
        end_idx = text.find("\nclass", idx)
        if end_idx == -1: end_idx = idx + 1000
        print(f"--- {model} ---")
        print(text[idx:end_idx].strip())
        print()
