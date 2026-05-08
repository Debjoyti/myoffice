import re

with open('frontend/src/components/Sidebar.js', 'r') as f:
    content = f.read()

nav_item = "        { id: 'job-studio', label: 'Job Studio', icon: Briefcase, path: '/job-studio', tcode: 'JOBS', desc: 'AI JD Drafts' },\n"
if "id: 'job-studio'" not in content:
    content = re.sub(r"        { id: 'recruitment', label: 'ATS & Hiring', icon: Users, path: '/recruitment', tcode: 'REC1', desc: 'Hiring dashboard' },\n", lambda m: m.group(0) + nav_item, content)

with open('frontend/src/components/Sidebar.js', 'w') as f:
    f.write(content)
