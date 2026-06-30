import uuid
from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict, Field

from app.models.models import RoleEnum, JobStatusEnum, JobTypeEnum, JobLevelEnum, ApplicationStageEnum

# ----------------- Users & Profiles -----------------

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str
    role: RoleEnum
    full_name: str

class UserResponse(UserBase):
    id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ProfileBase(BaseModel):
    full_name: str
    headline: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    role: RoleEnum

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    headline: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None

class ProfileResponse(ProfileBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

class AuthSession(BaseModel):
    user: UserResponse
    profile: ProfileResponse
    token: str

class SignInRequest(BaseModel):
    email: str
    password: str

# ----------------- Companies -----------------

class CompanyBase(BaseModel):
    name: str
    website: Optional[str] = None
    logo_url: Optional[str] = None
    about: str
    location: Optional[str] = None
    size: Optional[str] = None

class CompanyCreate(CompanyBase):
    slug: str

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    about: Optional[str] = None
    location: Optional[str] = None
    size: Optional[str] = None

class CompanyResponse(CompanyBase):
    id: uuid.UUID
    slug: str
    owner_id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- Jobs -----------------

class JobBase(BaseModel):
    title: str
    description: str
    requirements: List[str]
    location: Optional[str] = None
    remote: bool = False
    job_type: JobTypeEnum
    level: JobLevelEnum
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    tags: List[str]

class JobCreate(JobBase):
    company_id: uuid.UUID

class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    location: Optional[str] = None
    remote: Optional[bool] = None
    job_type: Optional[JobTypeEnum] = None
    level: Optional[JobLevelEnum] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    tags: Optional[List[str]] = None
    status: Optional[JobStatusEnum] = None
    featured: Optional[bool] = None

class JobFilters(BaseModel):
    query: Optional[str] = None
    tags: Optional[List[str]] = None
    remote: Optional[bool] = None
    job_type: Optional[JobTypeEnum] = None
    level: Optional[JobLevelEnum] = None
    salary_min: Optional[float] = None
    featured: Optional[bool] = None
    status: Optional[JobStatusEnum] = None

class JobResponse(JobBase):
    id: uuid.UUID
    company_id: uuid.UUID
    status: JobStatusEnum
    featured: bool
    views: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class JobWithCompanyResponse(JobResponse):
    company: CompanyResponse
    model_config = ConfigDict(from_attributes=True)

# ----------------- Resumes -----------------

class ParsedResume(BaseModel):
    titles: List[str]
    seniority: str
    skills: List[str]
    domains: List[str]
    suggested_keywords: List[str]
    years_experience: int

class KeywordsResponse(BaseModel):
    suggested_keywords: List[str]

class ResumeResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    file_name: str
    uploaded_at: datetime
    parsed: Optional[ParsedResume] = None
    model_config = ConfigDict(from_attributes=True)

# ----------------- Applications -----------------

class ApplicationBase(BaseModel):
    job_id: uuid.UUID
    cover_note: Optional[str] = None
    resume_id: Optional[uuid.UUID] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    stage: ApplicationStageEnum

class ApplicationResponse(ApplicationBase):
    id: uuid.UUID
    user_id: uuid.UUID
    stage: ApplicationStageEnum
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ProfileSnippet(BaseModel):
    id: uuid.UUID
    full_name: str
    avatar_url: Optional[str] = None
    headline: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class JobSnippet(BaseModel):
    id: uuid.UUID
    title: str
    company: Optional[dict] = None
    model_config = ConfigDict(from_attributes=True)

class ApplicationWithRelationsResponse(ApplicationResponse):
    applicant: Optional[ProfileSnippet] = None
    job: Optional[JobSnippet] = None
    model_config = ConfigDict(from_attributes=True)

# ----------------- Pagination & General -----------------

from typing import TypeVar, Generic
T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int

class SavedJobToggleResponse(BaseModel):
    saved: bool

class AdminStatsResponse(BaseModel):
    total_jobs: int
    live: int
    pending: int
    applications: int
    companies: int

class CheckoutSessionResponse(BaseModel):
    url: str
    session_id: str
