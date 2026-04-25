import re

with open('frontend/src/components/NotificationCenter.js', 'r') as f:
    content = f.read()

# Make notifications panel full width or shift it properly
old_pos = "position: 'absolute', top: 'calc(100% + 10px)', left: '10px', zIndex: 9999,"
new_pos = "position: 'absolute', top: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,"
content = content.replace(old_pos, new_pos)

with open('frontend/src/components/NotificationCenter.js', 'w') as f:
    f.write(content)
