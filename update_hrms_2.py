import re

with open('frontend/src/pages/HRMS.js', 'r') as f:
    content = f.read()

# Make charts side-by-side using 1fr 1fr grid
content = content.replace("gridTemplateColumns: '2fr 1fr'", "gridTemplateColumns: '1fr 1fr'")

with open('frontend/src/pages/HRMS.js', 'w') as f:
    f.write(content)
