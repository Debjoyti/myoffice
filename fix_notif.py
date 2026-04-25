import re

with open('frontend/src/components/NotificationCenter.js', 'r') as f:
    content = f.read()

# Fix the left/right positioning
old_pos = "position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 200,"
new_pos = "position: 'absolute', top: 'calc(100% + 10px)', left: '10px', zIndex: 200,"
content = content.replace(old_pos, new_pos)

with open('frontend/src/components/NotificationCenter.js', 'w') as f:
    f.write(content)
