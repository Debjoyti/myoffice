import re

with open('frontend/src/components/Sidebar.js', 'r') as f:
    content = f.read()

nav_item = "        { id: 'ai-screening', label: 'AI Screening', icon: FileText, path: '/ai-screening?job_id=fake-job-id', tcode: 'SCRN', desc: 'Top 5 Candidates' },\n"
if "id: 'ai-screening'" not in content:
    content = re.sub(r"        { id: 'candidate',.*\n", lambda m: m.group(0) + nav_item, content)

with open('frontend/src/components/Sidebar.js', 'w') as f:
    f.write(content)
