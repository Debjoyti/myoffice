import re

with open('frontend/src/App.js', 'r') as f:
    content = f.read()

import_statement = "import JobApply from './pages/JobApply';\n"
if "import JobApply" not in content:
    content = re.sub(r"import JobStudio from '\./pages/JobStudio';\n", lambda m: m.group(0) + import_statement, content)

route_statement = '        <Route path="/apply" element={<JobApply />} />\n'
if "path=\"/apply\"" not in content:
    content = re.sub(r'        <Route path="/job-studio".*\n', lambda m: m.group(0) + route_statement, content)

with open('frontend/src/App.js', 'w') as f:
    f.write(content)
