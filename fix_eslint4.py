import sys
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    lines = content.split('\n')
    new_lines = []
    for line in lines:
        if 'useEffect(() => { fetch' in line or 'useEffect(() => { fetchCompanies' in line:
            spaces = len(line) - len(line.lstrip())
            new_lines.append(' ' * spaces + '// eslint-disable-next-line react-hooks/exhaustive-deps')
        new_lines.append(line)

    with open(filepath, 'w') as f:
        f.write('\n'.join(new_lines))

fix_file('frontend/src/pages/CompanyOnboarding.js')
fix_file('frontend/src/pages/WFHRequests.js')
