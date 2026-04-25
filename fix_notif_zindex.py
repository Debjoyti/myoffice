import re

with open('frontend/src/components/NotificationCenter.js', 'r') as f:
    content = f.read()

# Fix the z-index to be higher than the command bar popup
old_zindex = "zIndex: 200,"
new_zindex = "zIndex: 9999,"
content = content.replace(old_zindex, new_zindex)

with open('frontend/src/components/NotificationCenter.js', 'w') as f:
    f.write(content)
