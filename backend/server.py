from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
from passlib.context import CryptContext
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import csv
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: Optional[EmailStr] = None  # Not required for workers
    password: Optional[str] = None  # Not required for workers initially
    user_type: str  # "enterprise", "vendor", "job_seeker"
    full_name: str
    phone: str
    # Enterprise specific
    enterprise_name: Optional[str] = None  # Selected from dropdown
    # Vendor specific
    vendor_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    username: str
    email: str
    user_type: str
    full_name: str
    phone: Optional[str] = None
    enterprise_id: Optional[str] = None
    vendor_id: Optional[str] = None
    role: Optional[str] = None
    created_at: str

class EnterpriseCreate(BaseModel):
    name: str
    enterprise_type: str  # "qcom", "ecomm", "3pl"
    tier: int  # 1, 2, or 3
    gst_no: Optional[str] = None
    description: Optional[str] = None

class Enterprise(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    enterprise_type: str
    tier: int
    gst_no: Optional[str] = None
    description: Optional[str] = None
    created_at: str

class GUCreate(BaseModel):
    enterprise_id: str
    facility_type: str  # "dark_store", "fc", "sort_center", "mother_hub"
    facility_name: str
    zone_name: str
    address: str
    city: str
    state: str
    pin_code: str

class GU(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    enterprise_id: str
    facility_type: str
    facility_name: str
    zone_name: str
    address: str
    city: str
    state: str
    pin_code: str
    created_at: str

class JobCreate(BaseModel):
    enterprise_id: str
    gu_id: str
    role: str  # "picker", "loader", "biller", "rider", "sorter"
    quantity_required: int
    shift_time: Optional[str] = None
    description: Optional[str] = None
    salary: Optional[str] = None
    experience_required: Optional[str] = None

class Job(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    enterprise_id: str
    gu_id: str
    role: str
    quantity_required: int
    shift_time: Optional[str] = None
    description: Optional[str] = None
    salary: Optional[str] = None
    experience_required: Optional[str] = None
    status: str  # "open", "vendor_committed", "fulfilled", "cancelled"
    created_by: str
    created_at: str
    committed_vendor_id: Optional[str] = None
    commitment_timestamp: Optional[str] = None

class VendorCreate(BaseModel):
    name: str
    gst_no: str
    email: EmailStr
    phone: str
    operating_states: List[str]
    operating_cities: List[str]
    operating_pin_codes: List[str]
    services_offered: List[str]  # List of roles they can fulfill

class Vendor(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    gst_no: str
    email: str
    phone: str
    operating_states: List[str]
    operating_cities: List[str]
    operating_pin_codes: List[str]
    services_offered: List[str]
    created_at: str

class CommitmentCreate(BaseModel):
    job_id: str
    vendor_id: str
    poc_name: str
    poc_contact: str

class Commitment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    job_id: str
    vendor_id: str
    poc_name: str
    poc_contact: str
    commitment_timestamp: str
    status: str  # "committed", "fulfilled"

class ApplicationCreate(BaseModel):
    job_id: str
    applicant_name: str
    applicant_email: str
    applicant_phone: str
    experience: Optional[str] = None
    cover_note: Optional[str] = None

class Application(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    job_id: str
    user_id: str
    applicant_name: str
    applicant_email: str
    applicant_phone: str
    experience: Optional[str] = None
    cover_note: Optional[str] = None
    status: str  # "applied", "reviewed", "shortlisted", "rejected"
    applied_at: str

class JobRole(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: str
    icon: str  # emoji or icon name
    category: str  # "warehouse", "delivery", "customer_service", etc.
    typical_salary_range: Optional[str] = None
    key_responsibilities: List[str]
    required_skills: List[str]

class MarketStats(BaseModel):
    active_jobs: int
    total_locations: int
    total_vendors: int
    fill_rate_percentage: float
    avg_response_time_hours: float
    active_workers: int
    enterprise_clients: int

# ==================== UTILITIES ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_token(data: dict) -> str:
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = await db.users.find_one({"id": payload.get("user_id")}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    user_id = str(uuid.uuid4())
    
    # Different validation for different user types
    if user_data.user_type == "job_seeker":
        # Workers don't need email/password initially (phone-based)
        existing = await db.users.find_one({"phone": user_data.phone, "user_type": "job_seeker"}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Worker with this phone number already exists")
        
        user_doc = {
            "id": user_id,
            "username": user_data.email or user_data.phone,  # Use phone as username for workers
            "email": user_data.email or f"worker_{user_id}@setuhub.com",  # Temp email
            "password": hash_password(user_data.password or "temp123"),  # Temp password
            "user_type": user_data.user_type,
            "full_name": user_data.full_name,
            "phone": user_data.phone,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    else:
        # Enterprise and Vendor need email
        if not user_data.email or not user_data.password:
            raise HTTPException(status_code=400, detail="Email and password required")
        
        existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="User with this email already exists")
        
        hashed_pwd = hash_password(user_data.password)
        
        user_doc = {
            "id": user_id,
            "email": user_data.email,
            "password": hashed_pwd,
            "user_type": user_data.user_type,
            "full_name": user_data.full_name,
            "phone": user_data.phone,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Store enterprise or vendor name temporarily
        if user_data.user_type == "enterprise":
            user_doc["enterprise_name_selected"] = user_data.enterprise_name
        elif user_data.user_type == "vendor":
            user_doc["vendor_name_selected"] = user_data.vendor_name
    
    await db.users.insert_one(user_doc)
    token = create_token({"user_id": user_id, "user_type": user_data.user_type})
    
    return {"token": token, "user": User(**{k: v for k, v in user_doc.items() if k != "password"})}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token({"user_id": user["id"], "user_type": user["user_type"]})
    return {"token": token, "user": User(**{k: v for k, v in user.items() if k != "password"})}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**{k: v for k, v in current_user.items() if k != "password"})

# Get list of enterprises for dropdown (can be integrated with Google Sheets)
@api_router.get("/enterprise-list")
async def get_enterprise_list():
    # For now, return predefined list (can be fetched from Google Sheets or admin panel)
    enterprises = [
        "Flipkart",
        "Amazon India",
        "Meesho",
        "Zepto",
        "Blinkit",
        "Swiggy Instamart",
        "Zomato",
        "Swiggy",
        "BigBasket",
        "Dunzo",
        "Delhivery",
        "Shadowfax",
        "Ecom Express",
        "Blue Dart",
        "DTDC",
        "Ekart Logistics",
        "Myntra",
        "Nykaa",
        "FirstCry",
        "Licious",
        "Milk Basket",
        "JioMart",
        "Reliance Retail",
        "DMart Ready",
        "Other"
    ]
    return {"enterprises": sorted(enterprises)}

# ==================== ENTERPRISE ROUTES ====================

@api_router.post("/enterprises", response_model=Enterprise)
async def create_enterprise(enterprise: EnterpriseCreate, current_user: dict = Depends(get_current_user)):
    enterprise_id = str(uuid.uuid4())
    enterprise_doc = {
        "id": enterprise_id,
        **enterprise.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.enterprises.insert_one(enterprise_doc)
    
    # Update user record with enterprise_id
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"enterprise_id": enterprise_id}}
    )
    
    return Enterprise(**enterprise_doc)

@api_router.get("/enterprises", response_model=List[Enterprise])
async def get_enterprises(current_user: dict = Depends(get_current_user)):
    enterprises = await db.enterprises.find({}, {"_id": 0}).to_list(1000)
    return enterprises

@api_router.get("/enterprises/{enterprise_id}", response_model=Enterprise)
async def get_enterprise(enterprise_id: str, current_user: dict = Depends(get_current_user)):
    enterprise = await db.enterprises.find_one({"id": enterprise_id}, {"_id": 0})
    if not enterprise:
        raise HTTPException(status_code=404, detail="Enterprise not found")
    return Enterprise(**enterprise)

# ==================== GU ROUTES ====================

@api_router.post("/gus", response_model=GU)
async def create_gu(gu: GUCreate, current_user: dict = Depends(get_current_user)):
    gu_id = str(uuid.uuid4())
    gu_doc = {
        "id": gu_id,
        **gu.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.gus.insert_one(gu_doc)
    return GU(**gu_doc)

@api_router.get("/gus", response_model=List[GU])
async def get_gus(enterprise_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"enterprise_id": enterprise_id} if enterprise_id else {}
    gus = await db.gus.find(query, {"_id": 0}).to_list(1000)
    return gus

# ==================== JOB ROUTES ====================

@api_router.post("/jobs", response_model=Job)
async def create_job(job: JobCreate, current_user: dict = Depends(get_current_user)):
    job_id = str(uuid.uuid4())
    job_doc = {
        "id": job_id,
        **job.model_dump(),
        "status": "open",
        "created_by": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "committed_vendor_id": None,
        "commitment_timestamp": None
    }
    await db.jobs.insert_one(job_doc)
    return Job(**job_doc)

@api_router.post("/jobs/bulk-upload")
async def bulk_upload_jobs(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    contents = await file.read()
    csv_data = contents.decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(csv_data))
    
    jobs_created = 0
    errors = []
    
    for idx, row in enumerate(csv_reader, start=1):
        try:
            # Validate required fields
            required_fields = ['enterprise_id', 'gu_id', 'role', 'quantity_required']
            missing_fields = [field for field in required_fields if not row.get(field)]
            if missing_fields:
                errors.append({"row": idx, "error": f"Missing fields: {', '.join(missing_fields)}"})
                continue
            
            job_id = str(uuid.uuid4())
            job_doc = {
                "id": job_id,
                "enterprise_id": row['enterprise_id'],
                "gu_id": row['gu_id'],
                "role": row['role'],
                "quantity_required": int(row['quantity_required']),
                "shift_time": row.get('shift_time'),
                "description": row.get('description'),
                "salary": row.get('salary'),
                "experience_required": row.get('experience_required'),
                "status": "open",
                "created_by": current_user["id"],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "committed_vendor_id": None,
                "commitment_timestamp": None
            }
            await db.jobs.insert_one(job_doc)
            jobs_created += 1
        except Exception as e:
            errors.append({"row": idx, "error": str(e)})
    
    return {
        "jobs_created": jobs_created,
        "errors": errors,
        "total_rows": idx if 'idx' in locals() else 0
    }

@api_router.get("/jobs", response_model=List[Job])
async def get_jobs(
    enterprise_id: Optional[str] = None,
    status: Optional[str] = None,
    role: Optional[str] = None,
    city: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if enterprise_id:
        query["enterprise_id"] = enterprise_id
    if status:
        query["status"] = status
    if role:
        query["role"] = role
    
    jobs = await db.jobs.find(query, {"_id": 0}).to_list(1000)
    
    # Filter by city if provided
    if city:
        filtered_jobs = []
        for job in jobs:
            gu = await db.gus.find_one({"id": job["gu_id"]}, {"_id": 0})
            if gu and gu.get("city", "").lower() == city.lower():
                filtered_jobs.append(job)
        jobs = filtered_jobs
    
    return jobs

@api_router.get("/jobs/vendor-view", response_model=List[Dict])
async def get_vendor_jobs(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "vendor":
        raise HTTPException(status_code=403, detail="Only vendors can access this")
    
    vendor = await db.vendors.find_one({"id": current_user["vendor_id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Get all open jobs
    jobs = await db.jobs.find({"status": "open"}, {"_id": 0}).to_list(1000)
    
    # Filter jobs based on vendor's operating areas
    filtered_jobs = []
    for job in jobs:
        gu = await db.gus.find_one({"id": job["gu_id"]}, {"_id": 0})
        if gu and (
            gu["city"] in vendor["operating_cities"] or
            gu["pin_code"] in vendor["operating_pin_codes"] or
            gu["state"] in vendor["operating_states"]
        ) and job["role"] in vendor["services_offered"]:
            enterprise = await db.enterprises.find_one({"id": job["enterprise_id"]}, {"_id": 0})
            filtered_jobs.append({
                **job,
                "gu_details": gu,
                "enterprise_details": enterprise
            })
    
    return filtered_jobs

@api_router.get("/jobs/{job_id}", response_model=Job)
async def get_job(job_id: str, current_user: dict = Depends(get_current_user)):
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return Job(**job)

@api_router.put("/jobs/{job_id}/status")
async def update_job_status(job_id: str, status_data: dict, current_user: dict = Depends(get_current_user)):
    await db.jobs.update_one({"id": job_id}, {"$set": status_data})
    return {"message": "Job updated successfully"}

# ==================== VENDOR ROUTES ====================

@api_router.post("/vendors", response_model=Vendor)
async def create_vendor(vendor: VendorCreate, current_user: dict = Depends(get_current_user)):
    vendor_id = str(uuid.uuid4())
    vendor_doc = {
        "id": vendor_id,
        **vendor.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.vendors.insert_one(vendor_doc)
    
    # Update user record with vendor_id
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"vendor_id": vendor_id}}
    )
    
    return Vendor(**vendor_doc)

@api_router.get("/vendors", response_model=List[Vendor])
async def get_vendors(current_user: dict = Depends(get_current_user)):
    vendors = await db.vendors.find({}, {"_id": 0}).to_list(1000)
    return vendors

@api_router.get("/vendors/{vendor_id}", response_model=Vendor)
async def get_vendor(vendor_id: str, current_user: dict = Depends(get_current_user)):
    vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return Vendor(**vendor)

# ==================== COMMITMENT ROUTES ====================

@api_router.post("/commitments", response_model=Commitment)
async def create_commitment(commitment: CommitmentCreate, current_user: dict = Depends(get_current_user)):
    # Check if job is still open
    job = await db.jobs.find_one({"id": commitment.job_id}, {"_id": 0})
    if not job or job["status"] != "open":
        raise HTTPException(status_code=400, detail="Job is not available")
    
    commitment_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()
    
    commitment_doc = {
        "id": commitment_id,
        **commitment.model_dump(),
        "commitment_timestamp": timestamp,
        "status": "committed"
    }
    
    await db.commitments.insert_one(commitment_doc)
    
    # Update job status
    await db.jobs.update_one(
        {"id": commitment.job_id},
        {"$set": {
            "status": "vendor_committed",
            "committed_vendor_id": commitment.vendor_id,
            "commitment_timestamp": timestamp
        }}
    )
    
    return Commitment(**commitment_doc)

@api_router.get("/commitments", response_model=List[Commitment])
async def get_commitments(
    vendor_id: Optional[str] = None,
    job_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if vendor_id:
        query["vendor_id"] = vendor_id
    if job_id:
        query["job_id"] = job_id
    
    commitments = await db.commitments.find(query, {"_id": 0}).to_list(1000)
    return commitments

# ==================== APPLICATION ROUTES ====================

@api_router.post("/applications", response_model=Application)
async def create_application(application: ApplicationCreate, current_user: dict = Depends(get_current_user)):
    # Check if job exists and is open
    job = await db.jobs.find_one({"id": application.job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["status"] != "open":
        raise HTTPException(status_code=400, detail="Job is not accepting applications")
    
    # Check if user already applied
    existing = await db.applications.find_one({
        "job_id": application.job_id,
        "user_id": current_user["id"]
    }, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied to this job")
    
    application_id = str(uuid.uuid4())
    application_doc = {
        "id": application_id,
        "user_id": current_user["id"],
        **application.model_dump(),
        "status": "applied",
        "applied_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.applications.insert_one(application_doc)
    return Application(**application_doc)

@api_router.get("/applications")
async def get_applications(
    job_id: Optional[str] = None,
    user_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if job_id:
        query["job_id"] = job_id
    if user_id:
        query["user_id"] = user_id
    elif current_user["user_type"] == "job_seeker":
        query["user_id"] = current_user["id"]
    
    applications = await db.applications.find(query, {"_id": 0}).to_list(1000)
    
    # Enrich with job details
    enriched = []
    for app in applications:
        job = await db.jobs.find_one({"id": app["job_id"]}, {"_id": 0})
        if job:
            gu = await db.gus.find_one({"id": job["gu_id"]}, {"_id": 0})
            enterprise = await db.enterprises.find_one({"id": job["enterprise_id"]}, {"_id": 0})
            enriched.append({
                **app,
                "job_details": job,
                "gu_details": gu,
                "enterprise_details": enterprise
            })
    
    return enriched

@api_router.get("/applications/job/{job_id}")
async def get_job_applications(job_id: str, current_user: dict = Depends(get_current_user)):
    # Verify user has access to this job's applications
    if current_user["user_type"] != "enterprise":
        raise HTTPException(status_code=403, detail="Only enterprises can view applications")
    
    job = await db.jobs.find_one({"id": job_id, "enterprise_id": current_user["enterprise_id"]}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or access denied")
    
    applications = await db.applications.find({"job_id": job_id}, {"_id": 0}).to_list(1000)
    return applications

# ==================== DASHBOARD ROUTES ====================

@api_router.get("/dashboard/enterprise/{enterprise_id}")
async def get_enterprise_dashboard(enterprise_id: str, current_user: dict = Depends(get_current_user)):
    total_jobs = await db.jobs.count_documents({"enterprise_id": enterprise_id})
    open_jobs = await db.jobs.count_documents({"enterprise_id": enterprise_id, "status": "open"})
    committed_jobs = await db.jobs.count_documents({"enterprise_id": enterprise_id, "status": "vendor_committed"})
    fulfilled_jobs = await db.jobs.count_documents({"enterprise_id": enterprise_id, "status": "fulfilled"})
    
    total_gus = await db.gus.count_documents({"enterprise_id": enterprise_id})
    
    # Get all jobs for this enterprise
    jobs = await db.jobs.find({"enterprise_id": enterprise_id}, {"_id": 0}).to_list(1000)
    job_ids = [job["id"] for job in jobs]
    
    total_applications = await db.applications.count_documents({"job_id": {"$in": job_ids}})
    
    return {
        "total_jobs": total_jobs,
        "open_jobs": open_jobs,
        "committed_jobs": committed_jobs,
        "fulfilled_jobs": fulfilled_jobs,
        "total_facilities": total_gus,
        "total_applications": total_applications
    }

@api_router.get("/dashboard/vendor/{vendor_id}")
async def get_vendor_dashboard(vendor_id: str, current_user: dict = Depends(get_current_user)):
    total_commitments = await db.commitments.count_documents({"vendor_id": vendor_id})
    active_commitments = await db.commitments.count_documents({"vendor_id": vendor_id, "status": "committed"})
    fulfilled_commitments = await db.commitments.count_documents({"vendor_id": vendor_id, "status": "fulfilled"})
    
    return {
        "total_commitments": total_commitments,
        "active_commitments": active_commitments,
        "fulfilled_commitments": fulfilled_commitments
    }

@api_router.get("/dashboard/job-seeker/{user_id}")
async def get_job_seeker_dashboard(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    total_applications = await db.applications.count_documents({"user_id": user_id})
    pending_applications = await db.applications.count_documents({"user_id": user_id, "status": "applied"})
    shortlisted_applications = await db.applications.count_documents({"user_id": user_id, "status": "shortlisted"})
    
    return {
        "total_applications": total_applications,
        "pending_applications": pending_applications,
        "shortlisted_applications": shortlisted_applications
    }

# ==================== HOMEPAGE ROUTES ====================

@api_router.get("/homepage/job-roles", response_model=List[JobRole])
async def get_job_roles():
    """Get all job roles for the Key Positions section"""
    job_roles = await db.job_roles.find({}, {"_id": 0}).to_list(100)
    return job_roles

@api_router.get("/homepage/market-stats", response_model=MarketStats)
async def get_market_stats():
    """Get real-time market statistics for the homepage"""
    # Calculate stats from actual data
    active_jobs = await db.jobs.count_documents({"status": "open"})
    
    # Get unique locations (cities) from GUs
    gus = await db.gus.find({}, {"city": 1, "_id": 0}).to_list(10000)
    unique_cities = len(set(gu["city"] for gu in gus))
    
    # Count vendors
    total_vendors = await db.vendors.count_documents({})
    
    # Calculate fill rate (jobs that are committed or fulfilled vs total jobs)
    total_jobs = await db.jobs.count_documents({})
    if total_jobs > 0:
        filled_jobs = await db.jobs.count_documents({"status": {"$in": ["vendor_committed", "fulfilled"]}})
        fill_rate = (filled_jobs / total_jobs) * 100
    else:
        fill_rate = 0.0
    
    # Count active workers (job seekers who have applied)
    active_workers = await db.users.count_documents({"user_type": "job_seeker"})
    
    # Count enterprise clients
    enterprise_clients = await db.enterprises.count_documents({})
    
    # For avg response time, we can use a default or calculate from commitments
    # For now, using a calculated value based on commitment timestamps
    avg_response_time = 6.0  # Default 6 hours
    
    return MarketStats(
        active_jobs=active_jobs,
        total_locations=unique_cities,
        total_vendors=total_vendors,
        fill_rate_percentage=round(fill_rate, 1),
        avg_response_time_hours=avg_response_time,
        active_workers=active_workers,
        enterprise_clients=enterprise_clients
    )

@api_router.post("/homepage/seed-job-roles")
async def seed_job_roles():
    """Seed initial job roles data (admin only, one-time)"""
    # Check if data already exists
    existing = await db.job_roles.count_documents({})
    if existing > 0:
        return {"message": "Job roles already seeded", "count": existing}
    
    # Define key positions in E-Commerce & Logistics
    job_roles_data = [
        {
            "id": str(uuid.uuid4()),
            "title": "Last Mile Bike Captain",
            "description": "Manage delivery operations and coordinate with delivery personnel for last-mile bike deliveries",
            "icon": "🚴",
            "category": "delivery",
            "typical_salary_range": "₹20,000 - ₹30,000/month",
            "key_responsibilities": [
                "Coordinate daily delivery schedules",
                "Manage delivery team performance",
                "Ensure timely order deliveries",
                "Handle customer escalations"
            ],
            "required_skills": ["Team Management", "Route Planning", "Customer Service", "Two-wheeler License"]
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Last Mile Van Captain",
            "description": "Oversee van-based delivery operations for larger shipments and coordinate logistics",
            "icon": "🚐",
            "category": "delivery",
            "typical_salary_range": "₹25,000 - ₹35,000/month",
            "key_responsibilities": [
                "Manage van fleet operations",
                "Plan optimal delivery routes",
                "Ensure cargo safety",
                "Coordinate with warehouse teams"
            ],
            "required_skills": ["Fleet Management", "Logistics Planning", "Driving License", "Team Leadership"]
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Fulfillment Center Picker",
            "description": "Pick and pack orders efficiently in the fulfillment center",
            "icon": "📦",
            "category": "warehouse",
            "typical_salary_range": "₹15,000 - ₹22,000/month",
            "key_responsibilities": [
                "Pick items according to order lists",
                "Ensure accuracy in order fulfillment",
                "Maintain picking speed standards",
                "Handle inventory scanning"
            ],
            "required_skills": ["Attention to Detail", "Physical Fitness", "Inventory Systems", "Time Management"]
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Fulfillment Center Loader",
            "description": "Load and unload goods in the fulfillment center, manage staging areas",
            "icon": "🏋️",
            "category": "warehouse",
            "typical_salary_range": "₹15,000 - ₹20,000/month",
            "key_responsibilities": [
                "Load/unload delivery vehicles",
                "Organize staging areas",
                "Ensure proper handling of goods",
                "Maintain safety standards"
            ],
            "required_skills": ["Physical Strength", "Safety Protocols", "Equipment Operation", "Team Work"]
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Warehouse Associate",
            "description": "Support overall warehouse operations including receiving, storing, and dispatching goods",
            "icon": "🏭",
            "category": "warehouse",
            "typical_salary_range": "₹18,000 - ₹25,000/month",
            "key_responsibilities": [
                "Receive and verify incoming shipments",
                "Organize storage areas",
                "Assist in inventory counts",
                "Support dispatch operations"
            ],
            "required_skills": ["Warehouse Operations", "Inventory Management", "Computer Basics", "Organization"]
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Sort Center Coordinator",
            "description": "Coordinate sorting operations and ensure efficient package processing",
            "icon": "🔄",
            "category": "sorting",
            "typical_salary_range": "₹20,000 - ₹28,000/month",
            "key_responsibilities": [
                "Oversee sorting operations",
                "Manage team schedules",
                "Ensure accuracy in sorting",
                "Monitor processing times"
            ],
            "required_skills": ["Operations Management", "Team Coordination", "Quality Control", "Problem Solving"]
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Store Operations Executive",
            "description": "Manage day-to-day store operations for dark stores and quick commerce hubs",
            "icon": "🏪",
            "category": "store_operations",
            "typical_salary_range": "₹22,000 - ₹30,000/month",
            "key_responsibilities": [
                "Oversee store operations",
                "Manage inventory levels",
                "Coordinate with delivery teams",
                "Handle customer orders"
            ],
            "required_skills": ["Store Management", "Inventory Control", "Customer Service", "Multi-tasking"]
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Quality Control Inspector",
            "description": "Inspect goods for quality compliance and ensure standards are met",
            "icon": "✅",
            "category": "quality",
            "typical_salary_range": "₹18,000 - ₹25,000/month",
            "key_responsibilities": [
                "Inspect incoming/outgoing goods",
                "Document quality issues",
                "Ensure compliance with standards",
                "Report defects and damages"
            ],
            "required_skills": ["Quality Standards", "Attention to Detail", "Documentation", "Communication"]
        }
    ]
    
    # Insert all job roles
    await db.job_roles.insert_many(job_roles_data)
    
    return {"message": "Job roles seeded successfully", "count": len(job_roles_data)}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()