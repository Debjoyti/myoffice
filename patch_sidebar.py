import re

with open('frontend/src/components/Sidebar.js', 'r') as f:
    content = f.read()

nav_item = '    { name: \'Job Studio\', path: \'/job-studio\', icon: \'🎙️\' },\n'
if "path: '/job-studio'" not in content:
    content = re.sub(r'    { name: \'Recruitment\', path: \'/recruitment\', icon: \'👥\' },\n', lambda m: m.group(0) + nav_item, content)

with open('frontend/src/components/Sidebar.js', 'w') as f:
    f.write(content)
