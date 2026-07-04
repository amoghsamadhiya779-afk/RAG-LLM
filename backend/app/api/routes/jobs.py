import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.db.session import get_db
from app.db.schemas import JobResponse, PaginatedResponse, JobFilters
from app.db.repositories.jobs_repo import JobsRepository
from app.db.models import User, RoleEnum
from app.core.deps import require_role

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("", response_model=PaginatedResponse[JobResponse])
async def get_jobs(
    page_size: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    q: Optional[str] = None,
    location: Optional[str] = None,
    remote: Optional[bool] = None,
    seniority: Optional[str] = None,
    employment_type: Optional[List[str]] = Query(None),
    tags: Optional[List[str]] = Query(None),
    salaryMin: Optional[float] = None,
    db: AsyncSession = Depends(get_db)
):
    repo = JobsRepository(db)
    
    filters = JobFilters(
        q=q,
        location=location,
        remote=remote,
        seniority=seniority,
        employment_type=employment_type,
        tags=tags,
        salary_min=salaryMin,
    )
    
    offset = (page - 1) * page_size
    
    jobs, total = await repo.query_jobs_with_count(filters, limit=page_size, offset=offset)
    
    return PaginatedResponse(
        items=[JobResponse.model_validate(j) for j in jobs],
        total=total,
        page=page,
        page_size=page_size
    )

@router.get("/mine", response_model=PaginatedResponse[JobResponse])
async def get_my_jobs(
    limit: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    user: User = Depends(require_role([RoleEnum.recruiter])),
    db: AsyncSession = Depends(get_db)
):
    repo = JobsRepository(db)
    # Get user's company and find jobs associated with it
    from app.db.models import Company
    from sqlalchemy import select
    comp_stmt = select(Company).where(Company.owner_id == user.id)
    comp_res = await db.execute(comp_stmt)
    company = comp_res.scalars().first()
    
    if not company:
        return PaginatedResponse(items=[], total=0, page=page, page_size=limit)
        
    filters = JobFilters(query=company.name)
    offset = (page - 1) * limit
    jobs, total = await repo.query_jobs_with_count(filters, limit=limit, offset=offset)
    
    return PaginatedResponse(
        items=[JobResponse.model_validate(j) for j in jobs],
        total=total,
        page=page,
        page_size=limit
    )

from app.db.schemas import JobCreate, JobUpdate
from app.services.rag.embeddings import build_embedding_model

@router.post("", response_model=JobResponse)
async def create_job(
    job_in: JobCreate,
    user: User = Depends(require_role([RoleEnum.recruiter])),
    db: AsyncSession = Depends(get_db)
):
    # Enforce source='internal'
    job_in.source = "internal"
    
    # Generate embedding for semantic search
    model = build_embedding_model()
    embeddings = model.embed([job_in.title + " " + (job_in.description_html or "")])
    embedding = embeddings[0]
    
    from app.db.models import Job
    job = Job(**job_in.model_dump(exclude_unset=True))
    job.embedding = embedding
    if not job.external_id:
        job.external_id = str(uuid.uuid4())
    
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return JobResponse.model_validate(job)

from pydantic import BaseModel

class EmployerStats(BaseModel):
    total_jobs: int
    live_jobs: int
    total_views: int
    total_applicants: int

@router.get("/employer/stats", response_model=EmployerStats)
async def get_employer_stats(
    user: User = Depends(require_role([RoleEnum.recruiter])),
    db: AsyncSession = Depends(get_db)
):
    from app.db.models import Job, Application, SavedJob
    from sqlalchemy import select, func
    
    # Simple count of jobs owned by this recruiter (or their company)
    # Since jobs don't have owner_id, we link them by company name for now, or just return 0s if they don't have a company
    from app.db.models import Company
    comp_stmt = select(Company).where(Company.owner_id == user.id)
    company = (await db.execute(comp_stmt)).scalars().first()
    
    if not company:
        return EmployerStats(total_jobs=0, live_jobs=0, total_views=0, total_applicants=0)
        
    job_count = (await db.execute(select(func.count()).select_from(Job).where(Job.company == company.name))).scalar() or 0
    app_count = (await db.execute(
        select(func.count()).select_from(Application)
        .join(Job, Application.job_id == Job.id)
        .where(Job.company == company.name)
    )).scalar() or 0
    
    return EmployerStats(
        total_jobs=job_count,
        live_jobs=job_count, # Mocked live
        total_views=job_count * 10, # Mocked views
        total_applicants=app_count
    )

@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: uuid.UUID,
    job_in: JobUpdate,
    user: User = Depends(require_role([RoleEnum.recruiter])),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import select
    from app.db.models import Job
    stmt = select(Job).where(Job.id == job_id)
    result = await db.execute(stmt)
    job = result.scalars().first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    for k, v in job_in.model_dump(exclude_unset=True).items():
        setattr(job, k, v)
        
    await db.commit()
    await db.refresh(job)
    return JobResponse.model_validate(job)

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    repo = JobsRepository(db)
    job = await repo.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobResponse.model_validate(job)
