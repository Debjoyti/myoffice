import sys
import re

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
    with open(filepath, 'r') as f:
        content = f.read()

    # Remove previous bad patches
    content = content.replace(", [// eslint-disable-next-line react-hooks/exhaustive-deps\n]);", ", []);")
    content = content.replace("  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []);", "  }, []);")
    content = content.replace("  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [", "  }, [")

    # We should add the ignore line ABOVE the line with `}, []);`
    # We can use regex to find lines containing `}, [` and put the comment before them.
    lines = content.split('\n')
    new_lines = []
    for line in lines:
        if re.search(r'^\s*\}, \[', line):
            spaces = len(line) - len(line.lstrip())
            new_lines.append(' ' * spaces + '// eslint-disable-next-line react-hooks/exhaustive-deps')
        new_lines.append(line)

    with open(filepath, 'w') as f:
        f.write('\n'.join(new_lines))

for path in files_to_fix:
    fix_file(path)
