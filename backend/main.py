from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_password_hash(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication")

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "employee"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    role: str
    organization_id: Optional[str] = None
    email_verified: bool = False
    subscription_status: str = "trial"
    subscription_limits: Optional[dict] = None
    enabled_services: Optional[List[str]] = None
    subscription_end_date: Optional[str] = None
    created_at: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Employee(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: Optional[str] = None
    name: str
    email: str
    phone: str
    department: str
    designation: str
    date_of_joining: Optional[str] = None
    pan_number: Optional[str] = None
    aadhaar_number: Optional[str] = None
    address: Optional[str] = None
    photo: Optional[str] = None
    status: str = "active"
    created_at: Optional[str] = None

class EmployeeCreate(BaseModel):
    name: str
    email: str
    phone: str
    department: str
    designation: str
    date_of_joining: Optional[str] = None
    pan_number: Optional[str] = None
    aadhaar_number: Optional[str] = None
    address: Optional[str] = None
    photo: Optional[str] = None

class Attendance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    employee_id: str
    date: str
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    status: str
    created_at: str

class AttendanceCreate(BaseModel):
    employee_id: str
    date: str
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    status: str = "present"

class LeaveRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    employee_id: str
    leave_type: str
    from_date: str
    to_date: str
    reason: str
    status: str = "pending"
    created_at: str

class LeaveRequestCreate(BaseModel):
    employee_id: str
    leave_type: str
    from_date: str
    to_date: str
    reason: str

class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: Optional[str] = None
    status: str = "active"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    created_at: Optional[str] = None

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    project_id: str
    title: str
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    status: str = "todo"
    priority: str = "medium"
    due_date: Optional[str] = None
    created_at: str

class TaskCreate(BaseModel):
    project_id: str
    title: str
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: str = "medium"
    due_date: Optional[str] = None

class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    source: Optional[str] = None
    status: str = "new"
    created_at: str

class LeadCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    source: Optional[str] = None

class Deal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    lead_id: str
    title: str
    value: float
    stage: str = "proposal"
    probability: int = 50
    expected_close_date: Optional[str] = None
    created_at: str

class DealCreate(BaseModel):
    lead_id: str
    title: str
    value: float
    stage: str = "proposal"
    probability: int = 50
    expected_close_date: Optional[str] = None

class Expense(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    employee_id: str
    category: str
    amount: float
    description: Optional[str] = None
    date: str
    status: str = "pending"
    created_at: str

class ExpenseCreate(BaseModel):
    employee_id: str
    category: str
    amount: float
    description: Optional[str] = None
    date: str

class InventoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    category: str
    quantity: int
    unit: str
    price_per_unit: float
    location: Optional[str] = None
    created_at: str

class StoreCreate(BaseModel):
    name: str
    location: str
    contact: Optional[str] = None
    manager: Optional[str] = None

class OfferLetter(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    organization_id: str
    name: str
    email: str
    phone: str
    designation: str
    ctc_yearly: float
    status: str = "Generated"
    created_at: str

class OfferLetterCreate(BaseModel):
    name: str
    email: str
    phone: str
    designation: str
    ctc_yearly: float
    is_metro: str
    pf_applied: str
    pf_cap: str
    esi_applied: str
    esi_state: str
    insurance_co: bool
    insurance_emp: bool
    food_allowance: bool
    details: dict # full breakdown and personal details
    status: str = "Generated"

class InventoryItemCreate(BaseModel):
    name: str
    category: str
    quantity: int
    unit: str
    price_per_unit: float
    location: Optional[str] = None

class DashboardStats(BaseModel):
    total_employees: int
    active_employees: int
    total_projects: int
    pending_leaves: int
    total_leads: int
    total_expenses: float
    pending_purchase_requests: int
    total_stores: int
    total_customers: int
    total_invoices: int
    total_tickets: int
    total_vendors: int
    total_timesheet_hours: float
    burn_rate: float
    projected_revenue: float
    hiring_progress: float

class Store(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    location: str
    manager: Optional[str] = None
    contact: Optional[str] = None
    status: str = "active"
    created_at: str

class StoreCreate(BaseModel):
    name: str
    location: str
    manager: Optional[str] = None
    contact: Optional[str] = None

class PurchaseRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    store_id: str
    requested_by: str
    items: List[dict]
    total_amount: float
    reason: Optional[str] = None
    status: str = "pending"
    approved_by: Optional[str] = None
    approved_date: Optional[str] = None
    created_at: str

class PurchaseRequestCreate(BaseModel):
    store_id: str
    requested_by: str
    items: List[dict]
    total_amount: float
    reason: Optional[str] = None

class PurchaseOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    purchase_request_id: str
    store_id: str
    supplier_name: str
    supplier_contact: Optional[str] = None
    items: List[dict]
    total_amount: float
    delivery_date: Optional[str] = None
    status: str = "pending"
    created_by: str
    created_at: str

class PurchaseOrderCreate(BaseModel):
    purchase_request_id: str
    store_id: str
    supplier_name: str
    supplier_contact: Optional[str] = None
    items: List[dict]
    total_amount: float
    delivery_date: Optional[str] = None
    created_by: str

class HRField(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    field_name: str
    field_type: str
    is_required: bool = False
    options: Optional[List[str]] = None
    applies_to: str
    created_at: str

class HRFieldCreate(BaseModel):
    field_name: str
    field_type: str
    is_required: bool = False
    options: Optional[List[str]] = None
    applies_to: str

class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    contact_person: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    organization_id: str
    created_at: str

class CustomerCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None

class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    invoice_number: str
    customer_id: str
    deal_id: Optional[str] = None
    items: List[dict]
    total_amount: float
    status: str = "draft"
    due_date: str
    organization_id: str
    created_at: str

class InvoiceCreate(BaseModel):
    customer_id: str
    deal_id: Optional[str] = None
    items: List[dict]
    total_amount: float
    due_date: str

class Timesheet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    employee_id: str
    project_id: str
    task_id: str
    hours: float
    date: str
    description: Optional[str] = None
    status: str = "submitted"
    organization_id: str
    created_at: str

class TimesheetCreate(BaseModel):
    project_id: str
    task_id: str
    hours: float
    date: str
    description: Optional[str] = None

class Ticket(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    subject: str
    description: str
    priority: str = "medium"
    status: str = "open"
    assigned_to: Optional[str] = None
    contact_email: EmailStr
    organization_id: str
    created_at: str

class TicketCreate(BaseModel):
    subject: str
    description: str
    priority: str = "medium"
    contact_email: EmailStr

class Vendor(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    category: Optional[str] = None
    organization_id: str
    created_at: str

class VendorCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    category: Optional[str] = None

class Asset(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    type: str # Laptop, Furniture, etc.
    serial_number: Optional[str] = None
    assigned_to: Optional[str] = None
    status: str = "available"
    purchase_date: Optional[str] = None
    value: float = 0.0
    organization_id: str
    created_at: str

class AssetCreate(BaseModel):
    name: str
    type: str
    serial_number: Optional[str] = None
    assigned_to: Optional[str] = None
    purchase_date: Optional[str] = None
    value: float = 0.0

class Announcement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    content: str
    author_id: str
    author_name: str
    priority: str = "normal" # normal, high, urgent
    organization_id: str
    created_at: str

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    priority: str = "normal"

class JobPosting(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    department: str
    location: str
    type: str # Full-time, Remote, etc.
    description: str
    status: str = "open"
    organization_id: str
    created_at: str

class JobPostingCreate(BaseModel):
    title: str
    department: str
    location: str
    type: str
    description: str

class Candidate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    job_id: str
    name: str
    email: EmailStr
    resume_url: Optional[str] = None
    status: str = "applied" # applied, screening, interview, offered, rejected
    organization_id: str
    created_at: str

class CandidateCreate(BaseModel):
    job_id: str
    name: str
    email: EmailStr
    resume_url: Optional[str] = None

class KnowledgeBaseArticle(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    content: str
    category: str
    author_name: str
    organization_id: str
    created_at: str

class AuditLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_email: str
    action: str
    module: str
    details: str
    organization_id: str
    created_at: str

class BusinessInsight(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    type: str # 'warning', 'opportunity', 'kpi'
    title: str
    message: str
    impact: str # 'high', 'medium', 'low'
    organization_id: str
    created_at: str

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    org_id = str(uuid.uuid4())
    verification_token = str(uuid.uuid4())
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hashed_password,
        "name": user_data.name,
        "role": "admin",
        "organization_id": org_id,
        "email_verified": False,
        "verification_token": verification_token,
        "subscription_status": "trial",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Track analytics
    await db.analytics.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "event_type": "user_registered",
        "event_data": {"email": user_data.email, "role": "admin"},
        "page": "registration",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    access_token = create_access_token(data={"sub": user_id})
    user_doc.pop("password")
    user_doc.pop("verification_token", None)
    return {"access_token": access_token, "token_type": "bearer", "user": user_doc}

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user["id"]})
    user.pop("password")
    
    # If employee, fetch org admin's services
    if user.get("role") == "employee" and user.get("organization_id"):
        admin = await db.users.find_one({"organization_id": user["organization_id"], "role": "admin"}, {"_id": 0, "enabled_services": 1, "subscription_end_date": 1})
        if admin:
            user["enabled_services"] = admin.get("enabled_services")
            user["subscription_end_date"] = admin.get("subscription_end_date")
            
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    user = current_user.copy()
    if user.get("role") == "employee" and user.get("organization_id"):
        admin = await db.users.find_one({"organization_id": user["organization_id"], "role": "admin"}, {"_id": 0, "enabled_services": 1, "subscription_end_date": 1})
        if admin:
            user["enabled_services"] = admin.get("enabled_services")
            user["subscription_end_date"] = admin.get("subscription_end_date")
    return user

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    org_id = current_user.get("organization_id")
    
    total_employees = await db.employees.count_documents({"organization_id": org_id})
    active_employees = await db.employees.count_documents({"organization_id": org_id, "status": "active"})
    total_projects = await db.projects.count_documents({"organization_id": org_id})
    pending_leaves = await db.leave_requests.count_documents({"organization_id": org_id, "status": "pending"})
    total_leads = await db.leads.count_documents({"organization_id": org_id})
    pending_purchase_requests = await db.purchase_requests.count_documents({"organization_id": org_id, "status": "pending"})
    total_stores = await db.stores.count_documents({"organization_id": org_id})
    
    expenses = await db.expenses.find({"organization_id": org_id}, {"_id": 0, "amount": 1}).to_list(1000)
    total_expenses = sum(exp.get("amount", 0) for exp in expenses)
    
    total_customers = await db.customers.count_documents({"organization_id": org_id})
    total_invoices = await db.invoices.count_documents({"organization_id": org_id})
    total_tickets = await db.tickets.count_documents({"organization_id": org_id})
    total_vendors = await db.vendors.count_documents({"organization_id": org_id})
    
    timesheets = await db.timesheets.find({"organization_id": org_id}, {"_id": 0, "hours": 1}).to_list(1000)
    total_timesheet_hours = sum(ts.get("hours", 0) for ts in timesheets)

    # Advanced Executive Stats
    burn_rate = total_expenses / 30 if total_expenses > 0 else 0 
    projected_revenue = total_invoices * 85000 if total_invoices > 0 else 0 
    hiring_progress = (total_employees / 100) * 100 if total_employees < 100 else 95
    
    return {
        "total_employees": total_employees,
        "active_employees": active_employees,
        "total_projects": total_projects,
        "pending_leaves": pending_leaves,
        "total_leads": total_leads,
        "total_expenses": total_expenses,
        "pending_purchase_requests": pending_purchase_requests,
        "total_stores": total_stores,
        "total_customers": total_customers,
        "total_invoices": total_invoices,
        "total_tickets": total_tickets,
        "total_vendors": total_vendors,
        "total_timesheet_hours": total_timesheet_hours,
        "burn_rate": burn_rate,
        "projected_revenue": projected_revenue,
        "hiring_progress": hiring_progress
    }

@api_router.post("/employees", response_model=Employee)
async def create_employee(emp_data: EmployeeCreate, current_user: dict = Depends(get_current_user)):
    # Limit check
    limits = current_user.get("subscription_limits") or {}
    max_employees = limits.get("max_employees")
    if max_employees is not None:
        count = await db.employees.count_documents({"organization_id": current_user.get("organization_id")})
        if count >= max_employees:
            raise HTTPException(status_code=403, detail="Employee limit reached. Please upgrade your subscription.")

    emp_doc = emp_data.model_dump()
    emp_doc["id"] = str(uuid.uuid4())
    emp_doc["organization_id"] = current_user.get("organization_id")
    emp_doc["status"] = "active"
    emp_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.employees.insert_one(emp_doc)
    return emp_doc

@api_router.get("/employees", response_model=List[Employee])
async def get_employees(current_user: dict = Depends(get_current_user)):
    query = {"organization_id": current_user.get("organization_id")} if current_user.get("role") != "superadmin" else {}
    employees = await db.employees.find(query, {"_id": 0}).to_list(1000)
    return employees

@api_router.get("/employees/{emp_id}", response_model=Employee)
async def get_employee(emp_id: str, current_user: dict = Depends(get_current_user)):
    emp = await db.employees.find_one({"id": emp_id}, {"_id": 0})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp

@api_router.put("/employees/{emp_id}", response_model=Employee)
async def update_employee(emp_id: str, emp_data: EmployeeCreate, current_user: dict = Depends(get_current_user)):
    result = await db.employees.update_one({"id": emp_id}, {"$set": emp_data.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    updated = await db.employees.find_one({"id": emp_id}, {"_id": 0})
    return updated

@api_router.delete("/employees/{emp_id}")
async def delete_employee(emp_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.employees.delete_one({"id": emp_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"message": "Employee deleted"}

@api_router.post("/attendance", response_model=Attendance)
async def create_attendance(att_data: AttendanceCreate, current_user: dict = Depends(get_current_user)):
    att_doc = att_data.model_dump()
    att_doc["id"] = str(uuid.uuid4())
    att_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.attendance.insert_one(att_doc)
    return att_doc

@api_router.get("/attendance", response_model=List[Attendance])
async def get_attendance(employee_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"employee_id": employee_id} if employee_id else {}
    attendance = await db.attendance.find(query, {"_id": 0}).to_list(1000)
    return attendance

@api_router.post("/leave-requests", response_model=LeaveRequest)
async def create_leave_request(leave_data: LeaveRequestCreate, current_user: dict = Depends(get_current_user)):
    leave_doc = leave_data.model_dump()
    leave_doc["id"] = str(uuid.uuid4())
    leave_doc["status"] = "pending"
    leave_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.leave_requests.insert_one(leave_doc)
    return leave_doc

@api_router.get("/leave-requests", response_model=List[LeaveRequest])
async def get_leave_requests(current_user: dict = Depends(get_current_user)):
    leaves = await db.leave_requests.find({}, {"_id": 0}).to_list(1000)
    return leaves

class StatusUpdate(BaseModel):
    status: str

class TeamInvite(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: EmailStr
    invited_by: str
    organization_id: str
    role: str = "employee"
    status: str = "pending"
    token: str
    expires_at: str
    created_at: str

class TeamInviteCreate(BaseModel):
    email: EmailStr
    role: str = "employee"

class Subscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    plan: str
    status: str
    amount: float
    currency: str = "INR"
    billing_cycle: str
    starts_at: str
    ends_at: str
    created_at: str

class SubscriptionCreate(BaseModel):
    plan: str
    billing_cycle: str = "monthly"

class Analytics(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: Optional[str] = None
    event_type: str
    event_data: dict
    page: Optional[str] = None
    timestamp: str

class AnalyticsCreate(BaseModel):
    event_type: str
    event_data: dict
    page: Optional[str] = None

@api_router.patch("/leave-requests/{leave_id}/status")
async def update_leave_status(leave_id: str, status_data: StatusUpdate, current_user: dict = Depends(get_current_user)):
    result = await db.leave_requests.update_one({"id": leave_id}, {"$set": {"status": status_data.status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Leave request not found")
    return {"message": "Status updated"}

@api_router.post("/projects", response_model=Project)
async def create_project(proj_data: ProjectCreate, current_user: dict = Depends(get_current_user)):
    # Limit check
    limits = current_user.get("subscription_limits") or {}
    max_projects = limits.get("max_projects")
    if max_projects is not None:
        count = await db.projects.count_documents({"organization_id": current_user.get("organization_id")})
        if count >= max_projects:
            raise HTTPException(status_code=403, detail="Project limit reached. Please upgrade your subscription.")

    proj_doc = proj_data.model_dump()
    proj_doc["id"] = str(uuid.uuid4())
    proj_doc["organization_id"] = current_user.get("organization_id")
    proj_doc["status"] = "active"
    proj_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.projects.insert_one(proj_doc)
    return proj_doc

@api_router.get("/projects", response_model=List[Project])
async def get_projects(current_user: dict = Depends(get_current_user)):
    query = {"organization_id": current_user.get("organization_id")} if current_user.get("role") != "superadmin" else {}
    projects = await db.projects.find(query, {"_id": 0}).to_list(1000)
    return projects

@api_router.post("/tasks", response_model=Task)
async def create_task(task_data: TaskCreate, current_user: dict = Depends(get_current_user)):
    task_doc = task_data.model_dump()
    task_doc["id"] = str(uuid.uuid4())
    task_doc["status"] = "todo"
    task_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.tasks.insert_one(task_doc)
    return task_doc

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(project_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"project_id": project_id} if project_id else {}
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(1000)
    return tasks

@api_router.patch("/tasks/{task_id}/status")
async def update_task_status(task_id: str, status_data: StatusUpdate, current_user: dict = Depends(get_current_user)):
    result = await db.tasks.update_one({"id": task_id}, {"$set": {"status": status_data.status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task status updated"}

@api_router.post("/leads", response_model=Lead)
async def create_lead(lead_data: LeadCreate, current_user: dict = Depends(get_current_user)):
    lead_doc = lead_data.model_dump()
    lead_doc["id"] = str(uuid.uuid4())
    lead_doc["status"] = "new"
    lead_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.leads.insert_one(lead_doc)
    return lead_doc

@api_router.get("/leads", response_model=List[Lead])
async def get_leads(current_user: dict = Depends(get_current_user)):
    leads = await db.leads.find({}, {"_id": 0}).to_list(1000)
    return leads

@api_router.post("/deals", response_model=Deal)
async def create_deal(deal_data: DealCreate, current_user: dict = Depends(get_current_user)):
    deal_doc = deal_data.model_dump()
    deal_doc["id"] = str(uuid.uuid4())
    deal_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.deals.insert_one(deal_doc)
    return deal_doc

@api_router.get("/deals", response_model=List[Deal])
async def get_deals(current_user: dict = Depends(get_current_user)):
    deals = await db.deals.find({}, {"_id": 0}).to_list(1000)
    return deals

@api_router.post("/expenses", response_model=Expense)
async def create_expense(exp_data: ExpenseCreate, current_user: dict = Depends(get_current_user)):
    exp_doc = exp_data.model_dump()
    exp_doc["id"] = str(uuid.uuid4())
    exp_doc["status"] = "pending"
    exp_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.expenses.insert_one(exp_doc)
    return exp_doc

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses(current_user: dict = Depends(get_current_user)):
    expenses = await db.expenses.find({}, {"_id": 0}).to_list(1000)
    return expenses

@api_router.post("/inventory", response_model=InventoryItem)
async def create_inventory_item(item_data: InventoryItemCreate, current_user: dict = Depends(get_current_user)):
    item_doc = item_data.model_dump()
    item_doc["id"] = str(uuid.uuid4())
    item_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.inventory.insert_one(item_doc)
    return item_doc

@api_router.get("/inventory", response_model=List[InventoryItem])
async def get_inventory(current_user: dict = Depends(get_current_user)):
    items = await db.inventory.find({}, {"_id": 0}).to_list(1000)
    return items

@api_router.post("/stores", response_model=Store)
async def create_store(store_data: StoreCreate, current_user: dict = Depends(get_current_user)):
    store_doc = store_data.model_dump()
    store_doc["id"] = str(uuid.uuid4())
    store_doc["status"] = "active"
    store_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.stores.insert_one(store_doc)
    return store_doc

@api_router.get("/stores", response_model=List[Store])
async def get_stores(current_user: dict = Depends(get_current_user)):
    stores = await db.stores.find({}, {"_id": 0}).to_list(1000)
    return stores

@api_router.get("/stores/{store_id}", response_model=Store)
async def get_store(store_id: str, current_user: dict = Depends(get_current_user)):
    store = await db.stores.find_one({"id": store_id}, {"_id": 0})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store

@api_router.put("/stores/{store_id}", response_model=Store)
async def update_store(store_id: str, store_data: StoreCreate, current_user: dict = Depends(get_current_user)):
    result = await db.stores.update_one({"id": store_id}, {"$set": store_data.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Store not found")
    updated = await db.stores.find_one({"id": store_id}, {"_id": 0})
    return updated

@api_router.delete("/stores/{store_id}")
async def delete_store(store_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.stores.delete_one({"id": store_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Store not found")
    return {"message": "Store deleted"}

@api_router.post("/purchase-requests", response_model=PurchaseRequest)
async def create_purchase_request(pr_data: PurchaseRequestCreate, current_user: dict = Depends(get_current_user)):
    pr_doc = pr_data.model_dump()
    pr_doc["id"] = str(uuid.uuid4())
    pr_doc["status"] = "pending"
    pr_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.purchase_requests.insert_one(pr_doc)
    return pr_doc

@api_router.get("/purchase-requests", response_model=List[PurchaseRequest])
async def get_purchase_requests(current_user: dict = Depends(get_current_user)):
    prs = await db.purchase_requests.find({}, {"_id": 0}).to_list(1000)
    return prs

@api_router.patch("/purchase-requests/{pr_id}/approve")
async def approve_purchase_request(pr_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.purchase_requests.update_one(
        {"id": pr_id},
        {"$set": {
            "status": "approved",
            "approved_by": current_user["id"],
            "approved_date": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Purchase request not found")
    return {"message": "Purchase request approved"}

@api_router.patch("/purchase-requests/{pr_id}/reject")
async def reject_purchase_request(pr_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.purchase_requests.update_one(
        {"id": pr_id},
        {"$set": {"status": "rejected", "approved_by": current_user["id"], "approved_date": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Purchase request not found")
    return {"message": "Purchase request rejected"}

@api_router.post("/purchase-orders", response_model=PurchaseOrder)
async def create_purchase_order(po_data: PurchaseOrderCreate, current_user: dict = Depends(get_current_user)):
    po_doc = po_data.model_dump()
    po_doc["id"] = str(uuid.uuid4())
    po_doc["status"] = "pending"
    po_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.purchase_orders.insert_one(po_doc)
    return po_doc

@api_router.get("/purchase-orders", response_model=List[PurchaseOrder])
async def get_purchase_orders(current_user: dict = Depends(get_current_user)):
    pos = await db.purchase_orders.find({}, {"_id": 0}).to_list(1000)
    return pos

@api_router.patch("/purchase-orders/{po_id}/status")
async def update_purchase_order_status(po_id: str, status_data: StatusUpdate, current_user: dict = Depends(get_current_user)):
    result = await db.purchase_orders.update_one({"id": po_id}, {"$set": {"status": status_data.status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return {"message": "Purchase order status updated"}

@api_router.post("/hr-fields", response_model=HRField)
async def create_hr_field(field_data: HRFieldCreate, current_user: dict = Depends(get_current_user)):
    field_doc = field_data.model_dump()
    field_doc["id"] = str(uuid.uuid4())
    field_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.hr_fields.insert_one(field_doc)
    return field_doc

@api_router.get("/hr-fields", response_model=List[HRField])
async def get_hr_fields(applies_to: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"applies_to": applies_to} if applies_to else {}
    fields = await db.hr_fields.find(query, {"_id": 0}).to_list(1000)
    return fields

@api_router.delete("/hr-fields/{field_id}")
async def delete_hr_field(field_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.hr_fields.delete_one({"id": field_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="HR field not found")
    return {"message": "HR field deleted"}

@api_router.post("/team/invite", response_model=TeamInvite)
async def invite_team_member(invite_data: TeamInviteCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can invite team members")
    
    # Check if user already exists
    existing = await db.users.find_one({"email": invite_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Check if invitation already sent
    existing_invite = await db.team_invites.find_one({"email": invite_data.email, "status": "pending"}, {"_id": 0})
    if existing_invite:
        raise HTTPException(status_code=400, detail="Invitation already sent")
    
    invite_token = str(uuid.uuid4())
    invite_doc = {
        "id": str(uuid.uuid4()),
        "email": invite_data.email,
        "invited_by": current_user["id"],
        "organization_id": current_user.get("organization_id"),
        "role": invite_data.role,
        "status": "pending",
        "token": invite_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.team_invites.insert_one(invite_doc)
    
    # Track analytics
    await db.analytics.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "event_type": "team_invite_sent",
        "event_data": {"invitee_email": invite_data.email, "role": invite_data.role},
        "page": "team",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return invite_doc

@api_router.get("/team/invites", response_model=List[TeamInvite])
async def get_team_invites(current_user: dict = Depends(get_current_user)):
    invites = await db.team_invites.find({
        "organization_id": current_user.get("organization_id")
    }, {"_id": 0}).to_list(100)
    return invites

@api_router.post("/team/accept-invite")
async def accept_invite(token: str, name: str, password: str):
    invite = await db.team_invites.find_one({"token": token, "status": "pending"}, {"_id": 0})
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid or expired invitation")
    
    # Check expiration
    expires_at = datetime.fromisoformat(invite["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Invitation has expired")
    
    # Create user account
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(password)
    user_doc = {
        "id": user_id,
        "email": invite["email"],
        "password": hashed_password,
        "name": name,
        "role": invite["role"],
        "organization_id": invite["organization_id"],
        "email_verified": True,
        "subscription_status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Update invite status
    await db.team_invites.update_one({"token": token}, {"$set": {"status": "accepted"}})
    
    # Track analytics
    await db.analytics.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "event_type": "invite_accepted",
        "event_data": {"email": invite["email"]},
        "page": "onboarding",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    access_token = create_access_token(data={"sub": user_id})
    user_doc.pop("password")
    return {"access_token": access_token, "token_type": "bearer", "user": user_doc}

@api_router.get("/team/members", response_model=List[User])
async def get_team_members(current_user: dict = Depends(get_current_user)):
    members = await db.users.find({
        "organization_id": current_user.get("organization_id")
    }, {"_id": 0, "password": 0, "verification_token": 0}).to_list(100)
    return members

@api_router.post("/auth/verify-email")
async def verify_email(token: str):
    user = await db.users.find_one({"verification_token": token}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Invalid verification token")
    
    await db.users.update_one(
        {"verification_token": token},
        {"$set": {"email_verified": True}, "$unset": {"verification_token": ""}}
    )
    
    # Track analytics
    await db.analytics.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "event_type": "email_verified",
        "event_data": {"email": user["email"]},
        "page": "verification",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Email verified successfully"}

@api_router.post("/subscriptions", response_model=Subscription)
async def create_subscription(sub_data: SubscriptionCreate, current_user: dict = Depends(get_current_user)):
    plans = {
        "starter": {"amount": 999, "features": ["Up to 50 employees", "Basic features"]},
        "professional": {"amount": 2999, "features": ["Up to 200 employees", "All features"]},
        "enterprise": {"amount": 9999, "features": ["Unlimited employees", "Premium support"]}
    }
    
    if sub_data.plan not in plans:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    plan_info = plans[sub_data.plan]
    
    # Calculate end date
    if sub_data.billing_cycle == "monthly":
        ends_at = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    else:
        ends_at = (datetime.now(timezone.utc) + timedelta(days=365)).isoformat()
    
    sub_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "plan": sub_data.plan,
        "status": "active",
        "amount": plan_info["amount"],
        "currency": "INR",
        "billing_cycle": sub_data.billing_cycle,
        "starts_at": datetime.now(timezone.utc).isoformat(),
        "ends_at": ends_at,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.subscriptions.insert_one(sub_doc)
    
    # Update user subscription status
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"subscription_status": "active"}}
    )
    
    # Track analytics
    await db.analytics.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "event_type": "subscription_created",
        "event_data": {"plan": sub_data.plan, "amount": plan_info["amount"]},
        "page": "subscription",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return sub_doc

@api_router.get("/subscriptions/plans")
async def get_subscription_plans():
    return {
        "plans": [
            {
                "id": "starter",
                "name": "Starter",
                "price_monthly": 999,
                "price_yearly": 9999,
                "features": ["Up to 50 employees", "Basic HR features", "Email support", "Mobile app access"]
            },
            {
                "id": "professional",
                "name": "Professional",
                "price_monthly": 2999,
                "price_yearly": 29999,
                "popular": True,
                "features": ["Up to 200 employees", "All HR features", "Priority support", "Advanced analytics", "API access"]
            },
            {
                "id": "enterprise",
                "name": "Enterprise",
                "price_monthly": 9999,
                "price_yearly": 99999,
                "features": ["Unlimited employees", "Custom features", "Dedicated support", "Custom integrations", "SLA guarantee"]
            }
        ]
    }

@api_router.get("/subscriptions/current")
async def get_current_subscription(current_user: dict = Depends(get_current_user)):
    # For company admin, they are the source of truth
    if current_user.get("role") == "admin":
        return {
            "status": current_user.get("subscription_status"),
            "end_date": current_user.get("subscription_end_date"),
            "limits": current_user.get("subscription_limits"),
            "enabled_services": current_user.get("enabled_services")
        }
    # For employee, take from admin
    if current_user.get("role") == "employee" and current_user.get("organization_id"):
        admin = await db.users.find_one({"organization_id": current_user["organization_id"], "role": "admin"})
        if admin:
            return {
                "status": admin.get("subscription_status"),
                "end_date": admin.get("subscription_end_date"),
                "limits": admin.get("subscription_limits"),
                "enabled_services": admin.get("enabled_services")
            }
    return None

@api_router.post("/analytics/track")
async def track_analytics(analytics_data: AnalyticsCreate, current_user: dict = Depends(get_current_user)):
    analytics_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "event_type": analytics_data.event_type,
        "event_data": analytics_data.event_data,
        "page": analytics_data.page,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.analytics.insert_one(analytics_doc)
    return {"message": "Event tracked"}

@api_router.get("/analytics/funnel")
async def get_onboarding_funnel(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    pipeline = [
        {"$match": {"event_type": {"$in": ["user_registered", "email_verified", "subscription_created", "team_invite_sent"]}}},
        {"$group": {"_id": "$event_type", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    
    results = await db.analytics.aggregate(pipeline).to_list(10)
    funnel = {item["_id"]: item["count"] for item in results}
    
    return {
        "registrations": funnel.get("user_registered", 0),
        "verifications": funnel.get("email_verified", 0),
        "subscriptions": funnel.get("subscription_created", 0),
        "invites_sent": funnel.get("team_invite_sent", 0),
        "conversion_rate": round((funnel.get("subscription_created", 0) / max(funnel.get("user_registered", 1), 1)) * 100, 2)
    }

class ClientLimitsUpdate(BaseModel):
    max_employees: Optional[int] = None
    max_projects: Optional[int] = None
    enabled_services: Optional[List[str]] = None
    subscription_end_date: Optional[str] = None

class ClientCreate(BaseModel):
    name: str
    email: str
    password: str
    max_employees: Optional[int] = None
    max_projects: Optional[int] = None
    enabled_services: Optional[List[str]] = None
    subscription_end_date: Optional[str] = None

@api_router.post("/saas/clients")
async def create_saas_client(client_data: ClientCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "superadmin":
        raise HTTPException(status_code=403, detail="Superadmin access required")
    existing = await db.users.find_one({"email": client_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    user_id = str(uuid.uuid4())
    org_id = str(uuid.uuid4())
    hashed_password = get_password_hash(client_data.password)
    
    limits = {}
    if client_data.max_employees is not None:
        limits["max_employees"] = client_data.max_employees
    if client_data.max_projects is not None:
        limits["max_projects"] = client_data.max_projects
        
    user_doc = {
        "id": user_id,
        "email": client_data.email,
        "password": hashed_password,
        "name": client_data.name,
        "role": "admin",
        "organization_id": org_id,
        "email_verified": True,
        "subscription_status": "active",
        "subscription_limits": limits,
        "enabled_services": client_data.enabled_services or [],
        "subscription_end_date": client_data.subscription_end_date,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    user_doc.pop("password")
    return {"message": "Client created successfully", "client": user_doc}

@api_router.get("/saas/clients")
async def get_saas_clients(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "superadmin":
        raise HTTPException(status_code=403, detail="Superadmin access required")
    # Return all admin users who represent a client
    clients = await db.users.find({"role": "admin"}, {"_id": 0, "password": 0}).to_list(1000)
    # Get counts
    for client in clients:
        org_id = client.get("organization_id")
        if org_id:
            emp_count = await db.employees.count_documents({"organization_id": org_id})
            proj_count = await db.projects.count_documents({"organization_id": org_id})
            client["usage"] = {
                "employees": emp_count,
                "projects": proj_count
            }
    return clients

@api_router.put("/saas/clients/{client_id}/limits")
async def update_client_limits(client_id: str, limits: ClientLimitsUpdate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "superadmin":
        raise HTTPException(status_code=403, detail="Superadmin access required")
    client = await db.users.find_one({"id": client_id})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    new_limits = client.get("subscription_limits") or {}
    if limits.max_employees is not None:
        new_limits["max_employees"] = limits.max_employees
    if limits.max_projects is not None:
        new_limits["max_projects"] = limits.max_projects
        
    update_data = {"subscription_limits": new_limits}
    if limits.enabled_services is not None:
        update_data["enabled_services"] = limits.enabled_services
    if limits.subscription_end_date is not None:
        update_data["subscription_end_date"] = limits.subscription_end_date

    await db.users.update_one({"id": client_id}, {"$set": update_data})
    return {"message": "Client settings updated", "limits": new_limits, "enabled_services": limits.enabled_services}

@api_router.post("/offer-letters", response_model=OfferLetter)
async def create_offer_letter(offer_data: OfferLetterCreate, current_user: dict = Depends(get_current_user)):
    offer_doc = offer_data.model_dump()
    offer_doc["id"] = f"OFFER-{str(uuid.uuid4())[:8].upper()}"
    offer_doc["organization_id"] = current_user.get("organization_id")
    offer_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.offer_letters.insert_one(offer_doc)
    return offer_doc

@api_router.get("/offer-letters", response_model=List[OfferLetter])
async def get_offer_letters(current_user: dict = Depends(get_current_user)):
    query = {"organization_id": current_user.get("organization_id")}
    offers = await db.offer_letters.find(query, {"_id": 0}).to_list(1000)
    return offers

@api_router.delete("/offer-letters/{offer_id}")
async def delete_offer_letter(offer_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.offer_letters.delete_one({"id": offer_id, "organization_id": current_user.get("organization_id")})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Offer letter not found")
    return {"message": "Offer letter deleted"}

# --- Zoho Inspired Routes ---

# Customers (Zoho CRM/Books)
@api_router.post("/customers", response_model=Customer)
async def create_customer(data: CustomerCreate, current_user: dict = Depends(get_current_user)):
    doc = data.model_dump()
    doc["id"] = f"CUST-{str(uuid.uuid4())[:8].upper()}"
    doc["organization_id"] = current_user.get("organization_id")
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.customers.insert_one(doc)
    return doc

@api_router.get("/customers", response_model=List[Customer])
async def get_customers(current_user: dict = Depends(get_current_user)):
    return await db.customers.find({"organization_id": current_user.get("organization_id")}, {"_id": 0}).to_list(1000)

# Invoices (Zoho Books)
@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(data: InvoiceCreate, current_user: dict = Depends(get_current_user)):
    doc = data.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["invoice_number"] = f"INV-{datetime.now().year}-{str(uuid.uuid4())[:4].upper()}"
    doc["organization_id"] = current_user.get("organization_id")
    doc["status"] = "draft"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.invoices.insert_one(doc)
    return doc

@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices(current_user: dict = Depends(get_current_user)):
    return await db.invoices.find({"organization_id": current_user.get("organization_id")}, {"_id": 0}).to_list(1000)

# Timesheets (Zoho Projects/People)
@api_router.post("/timesheets", response_model=Timesheet)
async def create_timesheet(data: TimesheetCreate, current_user: dict = Depends(get_current_user)):
    doc = data.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["employee_id"] = current_user.get("id") # current logged in user as the submitter
    doc["organization_id"] = current_user.get("organization_id")
    doc["status"] = "submitted"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.timesheets.insert_one(doc)
    return doc

@api_router.get("/timesheets", response_model=List[Timesheet])
async def get_timesheets(current_user: dict = Depends(get_current_user)):
    query = {"organization_id": current_user.get("organization_id")}
    # Employees see their own, admins see all
    if current_user.get("role") != "admin":
        query["employee_id"] = current_user.get("id")
    return await db.timesheets.find(query, {"_id": 0}).to_list(1000)

# Tickets (Zoho Desk)
@api_router.post("/tickets", response_model=Ticket)
async def create_ticket(data: TicketCreate, current_user: dict = Depends(get_current_user)):
    doc = data.model_dump()
    doc["id"] = f"TKT-{str(uuid.uuid4())[:6].upper()}"
    doc["organization_id"] = current_user.get("organization_id")
    doc["status"] = "open"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.tickets.insert_one(doc)
    return doc

@api_router.get("/tickets", response_model=List[Ticket])
async def get_tickets(current_user: dict = Depends(get_current_user)):
    return await db.tickets.find({"organization_id": current_user.get("organization_id")}, {"_id": 0}).to_list(1000)

# Vendors (Zoho Books/Inventory)
@api_router.post("/vendors", response_model=Vendor)
async def create_vendor(data: VendorCreate, current_user: dict = Depends(get_current_user)):
    doc = data.model_dump()
    doc["id"] = f"VND-{str(uuid.uuid4())[:8].upper()}"
    doc["organization_id"] = current_user.get("organization_id")
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.vendors.insert_one(doc)
    return doc

@api_router.get("/vendors", response_model=List[Vendor])
async def get_vendors(current_user: dict = Depends(get_current_user)):
    return await db.vendors.find({"organization_id": current_user.get("organization_id")}, {"_id": 0}).to_list(1000)

# Assets (Office Management)
@api_router.post("/assets", response_model=Asset)
async def create_asset(data: AssetCreate, current_user: dict = Depends(get_current_user)):
    doc = data.model_dump()
    doc["id"] = f"AST-{str(uuid.uuid4())[:8].upper()}"
    doc["organization_id"] = current_user.get("organization_id")
    doc["status"] = "in-use" if doc.get("assigned_to") else "available"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.assets.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/assets", response_model=List[Asset])
async def list_assets(current_user: dict = Depends(get_current_user)):
    role = current_user.get("role")
    query = {"organization_id": current_user.get("organization_id")}
    if role not in ["admin", "superadmin"]:
        query["assigned_to"] = current_user.get("email")
    return await db.assets.find(query, {"_id": 0}).to_list(1000)

# Announcements (Internal Feed)
@api_router.post("/announcements", response_model=Announcement)
async def create_announcement(data: AnnouncementCreate, current_user: dict = Depends(get_current_user)):
    doc = data.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["author_id"] = current_user["id"]
    doc["author_name"] = current_user["name"]
    doc["organization_id"] = current_user.get("organization_id")
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.announcements.insert_one(doc)
    return doc

@api_router.get("/announcements", response_model=List[Announcement])
async def get_announcements(current_user: dict = Depends(get_current_user)):
    return await db.announcements.find({"organization_id": current_user.get("organization_id")}, {"_id": 0}).sort("created_at", -1).to_list(100)

# Recruitment (ATS)
@api_router.post("/jobs", response_model=JobPosting)
async def create_job(data: JobPostingCreate, current_user: dict = Depends(get_current_user)):
    doc = data.model_dump()
    doc["id"] = f"JOB-{str(uuid.uuid4())[:6].upper()}"
    doc["organization_id"] = current_user.get("organization_id")
    doc["status"] = "open"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.jobs.insert_one(doc)
    return doc

@api_router.get("/jobs", response_model=List[JobPosting])
async def get_jobs(current_user: dict = Depends(get_current_user)):
    return await db.jobs.find({"organization_id": current_user.get("organization_id")}, {"_id": 0}).to_list(500)

@api_router.post("/candidates", response_model=Candidate)
async def create_candidate(data: CandidateCreate, current_user: dict = Depends(get_current_user)):
    doc = data.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["organization_id"] = current_user.get("organization_id")
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.candidates.insert_one(doc)
    return doc

@api_router.get("/candidates", response_model=List[Candidate])
async def get_candidates(job_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"organization_id": current_user.get("organization_id")}
    if job_id:
        query["job_id"] = job_id
    return await db.candidates.find(query, {"_id": 0}).to_list(1000)

# Knowledge Base (PM Strategy: Onboarding & Standardization)
@api_router.post("/kb", response_model=KnowledgeBaseArticle)
async def create_kb_article(data: dict, current_user: dict = Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "title": data.get("title"),
        "content": data.get("content"),
        "category": data.get("category", "General"),
        "author_name": current_user["name"],
        "organization_id": current_user["organization_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.kb.insert_one(doc)
    return doc

@api_router.get("/kb", response_model=List[KnowledgeBaseArticle])
async def get_kb_articles(category: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"organization_id": current_user["organization_id"]}
    if category:
        query["category"] = category
    return await db.kb.find(query, {"_id": 0}).to_list(1000)

# Audit logs (Enterprise Transparency)
@api_router.get("/audit", response_model=List[AuditLog])
async def get_audit_logs(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return await db.audit_logs.find({"organization_id": current_user["organization_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)


# Dashboard AI Insights (The 'Killer Feature' for a Top ERP)
@api_router.get("/insights", response_model=List[BusinessInsight])
async def get_insights(current_user: dict = Depends(get_current_user)):
    insights = []
    org_id = current_user.get("organization_id")
    
    # 1. Financial Insight: Pending Revenue
    overdue_invoices = await db.invoices.find({
        "organization_id": org_id,
        "status": {"$in": ["sent", "overdue"]}
    }).to_list(100)
    total_pending = sum(inv.get("total_amount", 0) for inv in overdue_invoices)
    
    if total_pending > 0:
        insights.append({
            "id": str(uuid.uuid4()),
            "type": "opportunity",
            "title": "Revenue Optimization",
            "message": f"You have ₹{total_pending:,.0f} in pending receivables. Automated follow-ups could improve cash flow by 12%.",
            "impact": "high",
            "organization_id": org_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    # 2. Resource Insight: Capacity
    tasks = await db.tasks.find({"status": "todo"}).to_list(500)
    if len(tasks) > 20:
        insights.append({
            "id": str(uuid.uuid4()),
            "type": "warning",
            "title": "Resource Strain",
            "message": f"Global backlog of {len(tasks)} tasks detected. Consider re-allocating engineering resources.",
            "impact": "medium",
            "organization_id": org_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    # 3. Expense Insight
    expenses = await db.expenses.find({"organization_id": org_id}).sort("date", -1).limit(50).to_list(50)
    if expenses:
        total_recent = sum(e.get("amount", 0) for e in expenses)
        insights.append({
            "id": str(uuid.uuid4()),
            "type": "kpi",
            "title": "Expense Trend",
            "message": f"Operational burn is ₹{total_recent:,.0f} over the last 50 transactions. Within healthy limits.",
            "impact": "low",
            "organization_id": org_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    return insights

# ============================================================
#  TRAVEL TRACKER MODULE
# ============================================================

class TripCreate(BaseModel):
    title: Optional[str] = "My Trip"

class LocationPost(BaseModel):
    trip_id: str
    lat: float
    lng: float

# Start a new trip
@api_router.post("/trips")
async def start_trip(data: TripCreate, current_user: dict = Depends(get_current_user)):
    trip_id = str(uuid.uuid4())
    trip = {
        "id": trip_id,
        "user_id": current_user["id"],
        "organization_id": current_user.get("organization_id"),
        "title": data.title,
        "status": "active",
        "start_time": datetime.now(timezone.utc).isoformat(),
        "end_time": None,
        "locations": []
    }
    await db.trips.insert_one(trip)
    trip.pop("_id", None)
    return trip

# Post a location update
@api_router.post("/location")
async def post_location(data: LocationPost, current_user: dict = Depends(get_current_user)):
    loc = {
        "id": str(uuid.uuid4()),
        "trip_id": data.trip_id,
        "lat": data.lat,
        "lng": data.lng,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.locations.insert_one(loc)
    # Update last known position on trip document
    await db.trips.update_one(
        {"id": data.trip_id, "user_id": current_user["id"]},
        {"$set": {"last_lat": data.lat, "last_lng": data.lng, "last_update": loc["timestamp"]}}
    )
    loc.pop("_id", None)
    return loc

# Get full trip with all locations (polyline data)
@api_router.get("/trip/{trip_id}")
async def get_trip(trip_id: str, current_user: dict = Depends(get_current_user)):
    trip = await db.trips.find_one({"id": trip_id}, {"_id": 0})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    locations = await db.locations.find(
        {"trip_id": trip_id}, {"_id": 0}
    ).sort("timestamp", 1).to_list(10000)
    trip["locations"] = locations
    return trip

# Get live (latest) location for a trip
@api_router.get("/live/{trip_id}")
async def get_live(trip_id: str):
    loc = await db.locations.find_one(
        {"trip_id": trip_id}, {"_id": 0}, sort=[("timestamp", -1)]
    )
    if not loc:
        raise HTTPException(status_code=404, detail="No live data")
    return loc

# End a trip
@api_router.post("/trip/{trip_id}/end")
async def end_trip(trip_id: str, current_user: dict = Depends(get_current_user)):
    await db.trips.update_one(
        {"id": trip_id, "user_id": current_user["id"]},
        {"$set": {"status": "completed", "end_time": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Trip completed"}

# List all trips for current user
@api_router.get("/trips")
async def list_trips(current_user: dict = Depends(get_current_user)):
    trips = await db.trips.find(
        {"user_id": current_user["id"]}, {"_id": 0}
    ).sort("start_time", -1).to_list(100)
    return trips

# Delete a trip
@api_router.delete("/trip/{trip_id}")
async def delete_trip(trip_id: str, current_user: dict = Depends(get_current_user)):
    await db.trips.delete_one({"id": trip_id, "user_id": current_user["id"]})
    await db.locations.delete_many({"trip_id": trip_id})
    return {"message": "Trip deleted"}

# Asset management logic moved above

app.include_router(api_router)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()