import re

with open('frontend/src/components/NotificationCenter.js', 'r') as f:
    content = f.read()

# Position the notification relative to the bell button but expanding to the right, outside the sidebar
old_pos = "position: 'fixed', top: '80px', left: '260px', zIndex: 9999,"
new_pos = "position: 'absolute', top: '0', left: 'calc(100% + 15px)', zIndex: 9999,"
content = content.replace(old_pos, new_pos)

with open('frontend/src/components/NotificationCenter.js', 'w') as f:
    f.write(content)
