from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def verify():
    c = AsyncIOMotorClient('mongodb://localhost:27017')
    d = c['myoffice']
    print("jobs:", await d.jobs.count_documents({}))
    print("candidates:", await d.candidates.count_documents({}))
    print("employees:", await d.employees.count_documents({}))
    print("leave:", await d.leave_requests.count_documents({}))
    print("wfh:", await d.wfh_requests.count_documents({}))
    print("attendance:", await d.attendance.count_documents({}))
    print("interviews:", await d.recruitment_interviews.count_documents({}))
    
    # Check org id distribution
    user = await d.users.find_one({})
    if user:
        org_id = user.get('organization_id', 'default')
        print(f"\nOrg ID: {org_id}")
        print("jobs (org):", await d.jobs.count_documents({"organization_id": org_id}))
        print("candidates (org):", await d.candidates.count_documents({"organization_id": org_id}))
    c.close()

asyncio.run(verify())
