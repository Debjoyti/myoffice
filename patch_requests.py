import re
import glob

files = glob.glob('backend/api/*.py')
for file in files:
    with open(file, 'r') as f:
        content = f.read()

    # Add request: Request to endpoint signatures if they use request.app.state.db
    # This is a bit hacky but works for fixing the tests
    content = re.sub(r'async def ([a-zA-Z0-9_]+)\(data: ([a-zA-Z0-9_]+)\):', r'async def \1(data: \2, request: Request):', content)
    content = re.sub(r'async def list_jobs\(company_id: str\):', r'async def list_jobs(company_id: str, request: Request):', content)
    content = re.sub(r'async def get_trust_profile\(person_id: str\):', r'async def get_trust_profile(person_id: str, request: Request):', content)
    content = re.sub(r'async def get_top_candidates\(job_id: str\):', r'async def get_top_candidates(job_id: str, request: Request):', content)

    with open(file, 'w') as f:
        f.write(content)
