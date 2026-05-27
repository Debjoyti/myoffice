import re

with open('frontend/src/App.js', 'r') as f:
    content = f.read()

import_statement = "import AIScreening from './pages/AIScreening';\n"
if "import AIScreening" not in content:
    content = re.sub(r"import CandidateProfile from '\./pages/CandidateProfile';\n", lambda m: m.group(0) + import_statement, content)

route_statement = '        <Route path="/ai-screening" element={<AIScreening />} />\n'
if "path=\"/ai-screening\"" not in content:
    content = re.sub(r'        <Route path="/candidate".*\n', lambda m: m.group(0) + route_statement, content)

with open('frontend/src/App.js', 'w') as f:
    f.write(content)
