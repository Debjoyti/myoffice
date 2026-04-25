import re

with open('frontend/src/components/NotificationCenter.js', 'r') as f:
    content = f.read()

# Make it fixed position, top left relative to the whole viewport, clear of the sidebar
old_pos = "position: 'absolute', top: '0', left: 'calc(100% + 15px)', zIndex: 9999,"
new_pos = "position: 'fixed', top: '80px', left: '260px', zIndex: 9999,"
content = content.replace(old_pos, new_pos)

with open('frontend/src/components/NotificationCenter.js', 'w') as f:
    f.write(content)
