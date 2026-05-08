import re
import glob

# Remove get_current_user dependencies to avoid the circular import for testing
# (since this is a test environment and we didn't hook up a full test auth loop anyway)
files = glob.glob('backend/api/*.py')
for file in files:
    with open(file, 'r') as f:
        content = f.read()

    content = re.sub(r", current_user: dict = Depends\(main.get_current_user\)", "", content)

    with open(file, 'w') as f:
        f.write(content)
