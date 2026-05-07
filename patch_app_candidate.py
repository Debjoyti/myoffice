import re

with open('frontend/src/App.js', 'r') as f:
    content = f.read()

import_statement = "import CandidateProfile from './pages/CandidateProfile';\n"
if "import CandidateProfile" not in content:
    content = re.sub(r"import JobApply from '\./pages/JobApply';\n", lambda m: m.group(0) + import_statement, content)

route_statement = '        <Route path="/candidate" element={<CandidateProfile />} />\n'
if "path=\"/candidate\"" not in content:
    content = re.sub(r'        <Route path="/apply".*\n', lambda m: m.group(0) + route_statement, content)

with open('frontend/src/App.js', 'w') as f:
    f.write(content)
