import re

with open('frontend/src/App.js', 'r') as f:
    content = f.read()

# Add import
import_statement = "import JobStudio from './pages/JobStudio';\n"
if "import JobStudio" not in content:
    content = re.sub(r"import Dashboard from '\./pages/Dashboard';\n", r"import Dashboard from './pages/Dashboard';\n" + import_statement, content)

# Add route
route_statement = '              <Route path="/job-studio" element={<JobStudio />} />\n'
if "path=\"/job-studio\"" not in content:
    content = re.sub(r'              <Route path="/recruitment" element={<Recruitment />} />\n', r'              <Route path="/recruitment" element={<Recruitment />} />\n' + route_statement, content)

with open('frontend/src/App.js', 'w') as f:
    f.write(content)
