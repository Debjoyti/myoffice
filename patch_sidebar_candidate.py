import re

with open('frontend/src/components/Sidebar.js', 'r') as f:
    content = f.read()

nav_item = "        { id: 'candidate', label: 'Candidate Search', icon: Users, path: '/candidate?person_id=test', tcode: 'CAND', desc: 'Trust Profile' },\n"
if "id: 'candidate'" not in content:
    content = re.sub(r"        { id: 'job-studio',.*\n", lambda m: m.group(0) + nav_item, content)

with open('frontend/src/components/Sidebar.js', 'w') as f:
    f.write(content)
