import re

with open('frontend/src/App.js', 'r') as f:
    content = f.read()

route_statement = '        <Route path="/job-studio" element={user && !needsOnboarding ? <JobStudio user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />\n'
if "path=\"/job-studio\"" not in content:
    content = re.sub(r'        <Route path="/recruitment".*\n', lambda m: m.group(0) + route_statement, content)

with open('frontend/src/App.js', 'w') as f:
    f.write(content)
