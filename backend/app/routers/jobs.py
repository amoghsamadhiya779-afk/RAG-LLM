import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.db.session import get_db
from app.schemas.schemas import JobCreate, JobUpdate, JobResponse, JobWithCompanyResponse, PaginatedResponse, JobFilters
from app.repositories.job_repo import JobRepository
from app.core.deps import get_current_user, require_role, get_current_profile
from app.models.models import User, Profile, RoleEnum

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("", response_model=PaginatedResponse[JobWithCompanyResponse])
async def get_jobs(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    query: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    remote: Optional[bool] = None,
    jobType: Optional[str] = None,
    level: Optional[str] = None,
    salaryMin: Optional[float] = None,
    featured: Optional[bool] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    repo = JobRepository(db)
    filters = JobFilters(
        query=query,
        tags=tags,
        remote=remote,
        job_type=jobType,
        level=level,
        salary_min=salaryMin,
        featured=featured,
        status=status or "live"
    )
    jobs, total = await repo.get_all(filters, page, pageSize)
    
    return PaginatedResponse(
        items=[JobWithCompanyResponse.model_validate(j) for j in jobs],
        total=total,
        page=page,
        page_size=pageSize
    )

@router.get("/mine", response_model=List[JobWithCompanyResponse])
async def get_my_jobs(
    user: User = Depends(require_role([RoleEnum.employer])),
    db: AsyncSession = Depends(get_db)
):
    repo = JobRepository(db)
    jobs = await repo.get_mine(user.id)
    return [JobWithCompanyResponse.model_validate(j) for j in jobs]

@router.get("/search", response_model=List[JobWithCompanyResponse])
async def search_jobs(
    q: str,
    db: AsyncSession = Depends(get_db)
):
    # In a full implementation, we'd embed the query using the RAG pipeline
    # and pass the vector to search_semantic.
    # For now, this is a placeholder returning empty list until RAG is wired.
    return []

@router.get("/{job_id}", response_model=JobWithCompanyResponse)
async def get_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    repo = JobRepository(db)
    job = await repo.get_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobWithCompanyResponse.model_validate(job)

@router.post("", response_model=JobResponse)
async def create_job(
    job_in: JobCreate, 
    user: User = Depends(require_role([RoleEnum.employer])),
    db: AsyncSession = Depends(get_db)
):
    # Verify company belongs to user
    repo = JobRepository(db)
    # create
    job = await repo.create(job_in)
    # In real implementation: enqueue embedding task here
    return JobResponse.model_validate(job)

@router.patch("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: uuid.UUID,
    job_in: JobUpdate,
    user: User = Depends(require_role([RoleEnum.employer, RoleEnum.admin])),
    db: AsyncSession = Depends(get_db)
):
    repo = JobRepository(db)
    job = await repo.update(job_id, job_in)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobResponse.model_validate(job)
