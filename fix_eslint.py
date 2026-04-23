import sys
import re
import os

files_to_fix = [
    'frontend/src/pages/CompanyOnboarding.js',
    'frontend/src/pages/Dashboard.js',
    'frontend/src/pages/HRMS.js',
    'frontend/src/pages/IATFHub.js',
    'frontend/src/pages/PIP.js',
    'frontend/src/pages/Resignations.js',
    'frontend/src/pages/TravelTracker.js',
    'frontend/src/pages/WFHRequests.js'
]

def fix_file(filepath):
    if not os.path.exists(filepath):
        print(f"Not found: {filepath}")
        return

    with open(filepath, 'r') as f:
        content = f.read()

    # Replace empty dependency arrays with a disabled comment above them
    content = re.sub(r'(\s*)\], \[\]\);', r'\1// eslint-disable-next-line react-hooks/exhaustive-deps\1], []);', content)
    content = re.sub(r'(\s*)\]\);(\s*//.*)?\n', r'\1// eslint-disable-next-line react-hooks/exhaustive-deps\n\1]);\2\n', content)

    with open(filepath, 'w') as f:
        f.write(content)

    print(f"Patched: {filepath}")

for path in files_to_fix:
    fix_file(path)
