import glob

files = glob.glob('backend/api/*.py')
for file in files:
    with open(file, 'r') as f:
        content = f.read()

    if "db.jobs.insert_one" in content or "db.applications" in content or "db.persons" in content or "db.verifications" in content or "db.trust_scores" in content:
        if "from main import db" not in content and "import main" not in content:
            # For circular import workarounds, we can import db inside the functions or use request.app.state.db
            # Better: just import main and use main.db, main.get_current_user inside the module body,
            # or lazy import.
            pass

# A simpler way is to just do `import main` at the top and use `main.db`, `main.get_current_user` everywhere.
