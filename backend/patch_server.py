import re

def patch_server():
    with open("c:/Users/Debjoyti/Downloads/myoffice-main/myoffice-main/backend/server.py", "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Add organization_id to all DB models
    models = [
        "Employee", "Attendance", "LeaveRequest", "Project", "Task", 
        "Lead", "Deal", "Expense", "InventoryItem", "Store", 
        "PurchaseRequest", "PurchaseOrder", "HRField"
    ]
    for model in models:
        pattern = f"class {model}\\(BaseModel\\):\n    model_config = ConfigDict\\(extra=\"ignore\"\\)\n    id: str\n"
        replacement = f"class {model}(BaseModel):\n    model_config = ConfigDict(extra=\"ignore\")\n    id: str\n    organization_id: str\n"
        content = re.sub(pattern, replacement, content)
        
    # For Create models, we don't need organization_id in input, but we inject it in logic
    collections = {
        "employees": "emp_doc\\[\"organization_id\"\\] = current_user.get\\(\"organization_id\"\\)",
        "attendance": "att_doc\\[\"organization_id\"\\] = current_user.get\\(\"organization_id\"\\)",
        "leave_requests": "leave_doc\\[\"organization_id\"\\] = current_user.get\\(\"organization_id\"\\)",
        "projects": "proj_doc\\[\"organization_id\"\\] = current_user.get\\(\"organization_id\"\\)",
        "tasks": "task_doc\\[\"organization_id\"\\] = current_user.get\\(\"organization_id\"\\)",
        "leads": "lead_doc\\[\"organization_id\"\\] = current_user.get\\(\"organization_id\"\\)",
        "deals": "deal_doc\\[\"organization_id\"\\] = current_user.get\\(\"organization_id\"\\)",
        "expenses": "exp_doc\\[\"organization_id\"\\] = current_user.get\\(\"organization_id\"\\)",
        "inventory": "item_doc\\[\"organization_id\"\\] = current_user.get\\(\"organization_id\"\\)",
        "stores": "store_doc\\[\"organization_id\"\\] = current_user.get\\(\"organization_id\"\\)",
        "purchase_requests": "pr_doc\\[\"organization_id\"\\] = current_user.get\\(\"organization_id\"\\)",
        "purchase_orders": "po_doc\\[\"organization_id\"\\] = current_user.get\\(\"organization_id\"\\)",
        "hr_fields": "field_doc\\[\"organization_id\"\\] = current_user.get\\(\"organization_id\"\\)",
    }

    # 2. Inject organization_id on insert_one
    for col, injection in collections.items():
        # find `await db.{col}.insert_one({doc})`
        # doc is usually `emp_doc`, `att_doc`, etc.
        # We look for `<doc>["created_at"] = ...` and append our injection after it
        var_match = re.search(fr'(\w+)\["created_at"\] = datetime\.now\(timezone\.utc\)\.isoformat\(\)\n', content)
        # Actually it's better to just do a precise replace for each
        doc_var = injection.split('\\')[0].split('[')[0] # e.g. emp_doc
        pattern = fr'({doc_var}\["created_at"\] = datetime\.now\(timezone\.utc\)\.isoformat\(\)\n)'
        real_injection = injection.replace('\\', '')
        content = re.sub(pattern, fr'\1    {real_injection}\n', content)

    # 3. Update all db.{collection}.find() or find_one() or update_one() or delete_one() to include organization_id checks
    
    # 3.1. .find({}, ... -> .find({"organization_id": current_user.get("organization_id")}, ...
    content = content.replace('.find({},', '.find({"organization_id": current_user.get("organization_id")},')
    
    # 3.2. .find_one({"id": ...}, -> .find_one({"id": ..., "organization_id": current_user.get("organization_id")},
    content = re.sub(r'\.find_one\(\{"id":\s*([^,\}]+)\}', r'.find_one({"id": \1, "organization_id": current_user.get("organization_id")}', content)

    # 3.3. .update_one({"id": ...}, -> .update_one({"id": ..., "organization_id": current_user.get("organization_id")},
    content = re.sub(r'\.update_one\(\{"id":\s*([^,\}]+)\}', r'.update_one({"id": \1, "organization_id": current_user.get("organization_id")}', content)

    # 3.4. .delete_one({"id": ...}) -> .delete_one({"id": ..., "organization_id": current_user.get("organization_id")})
    content = re.sub(r'\.delete_one\(\{"id":\s*([^\}]+)\}\)', r'.delete_one({"id": \1, "organization_id": current_user.get("organization_id")})', content)

    # 3.5. Queries that are constructed like:
    # query = {"employee_id": employee_id} if employee_id else {}
    # We should add organization_id to query.
    content = re.sub(r'query = \{"([^"]+)": ([^\}]+)\} if \2 else \{\}',
                     r'query = {"\1": \2} if \2 else {}; query["organization_id"] = current_user.get("organization_id")', content)
                     
    content = re.sub(r'query = \{"applies_to": applies_to\} if applies_to else \{\}',
                     r'query = {"applies_to": applies_to} if applies_to else {}; query["organization_id"] = current_user.get("organization_id")', content)

    # 4. Add limits checking utility
    limits_code = """
async def check_limits(organization_id: str, resource_type: str, current_count: int):
    # Fetch subscription limits
    org = await db.organizations.find_one({"id": organization_id})
    if not org or "limits" not in org:
        return # No limits applied (e.g. legacy or superadmin)
    limits = org["limits"]
    if resource_type in limits and limits[resource_type] != -1: # -1 means unlimited
        if current_count >= limits[resource_type]:
            raise HTTPException(status_code=403, detail=f"Limit reached for {resource_type}. Please upgrade your plan.")

@api_router.get("/saas/clients")
async def get_saas_clients(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "superadmin":
        raise HTTPException(status_code=403, detail="Superadmin access required")
    # Return organizations and limits
    orgs = await db.organizations.find({}, {"_id": 0}).to_list(1000)
    for org in orgs:
        admin = await db.users.find_one({"organization_id": org["id"], "role": "admin"}, {"_id": 0})
        org["admin"] = admin
    return orgs

class OrganizationCreate(BaseModel):
    name: str
    admin_name: str
    admin_email: str
    admin_password: str
    limits: dict

@api_router.post("/saas/clients")
async def create_saas_client(org_data: OrganizationCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "superadmin":
        raise HTTPException(status_code=403, detail="Superadmin access required")
    org_id = str(uuid.uuid4())
    org_doc = {
        "id": org_id,
        "name": org_data.name,
        "limits": org_data.limits,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.organizations.insert_one(org_doc)
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(org_data.admin_password)
    user_doc = {
        "id": user_id,
        "email": org_data.admin_email,
        "password": hashed_password,
        "name": org_data.admin_name,
        "role": "admin",
        "organization_id": org_id,
        "email_verified": True,
        "subscription_status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    return {"message": "Client organization created successfully", "org": org_doc}

@api_router.put("/saas/clients/{org_id}")
async def update_saas_client(org_id: str, limits: dict, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "superadmin":
        raise HTTPException(status_code=403, detail="Superadmin access required")
    await db.organizations.update_one({"id": org_id}, {"$set": {"limits": limits}})
    return {"message": "Client limits updated"}
"""

    # Inject limit checks in create handlers
    content = content.replace("app.include_router(api_router)", limits_code + "\n\napp.include_router(api_router)")
    
    # We will inject limit check for employee create
    emp_limit_check = """
    org_id = current_user.get("organization_id")
    count = await db.employees.count_documents({"organization_id": org_id})
    await check_limits(org_id, "max_employees", count)
"""
    content = re.sub(r'async def create_employee\(emp_data: EmployeeCreate, current_user: dict = Depends\(get_current_user\)\):\s+emp_doc = emp_data\.model_dump\(\)', 
                     f'async def create_employee(emp_data: EmployeeCreate, current_user: dict = Depends(get_current_user)):{emp_limit_check}    emp_doc = emp_data.model_dump()', content)

    # Inject for users too if they are registered manually
    # Actually wait, team invites act as new users
    invite_limit_check = """
    org_id = current_user.get("organization_id")
    count = await db.users.count_documents({"organization_id": org_id})
    await check_limits(org_id, "max_users", count)
"""
    content = re.sub(r'async def invite_team_member\(invite_data: TeamInviteCreate, current_user: dict = Depends\(get_current_user\)\):\s+if current_user\.get\("role"\) != "admin":\s+raise HTTPException\(status_code=403, detail="Only admins can invite team members"\)', 
                     f'async def invite_team_member(invite_data: TeamInviteCreate, current_user: dict = Depends(get_current_user)):\n    if current_user.get("role") != "admin":\n        raise HTTPException(status_code=403, detail="Only admins can invite team members"){invite_limit_check}', content)


    with open("c:/Users/Debjoyti/Downloads/myoffice-main/myoffice-main/backend/server_patched.py", "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    patch_server()
