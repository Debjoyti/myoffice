import re

with open('frontend/src/components/NotificationCenter.js', 'r') as f:
    content = f.read()

# I see it's clipped by the sidebar. We need to maybe change the width
old_width = "width: '380px',"
new_width = "width: '350px',"
content = content.replace(old_width, new_width)

with open('frontend/src/components/NotificationCenter.js', 'w') as f:
    f.write(content)
