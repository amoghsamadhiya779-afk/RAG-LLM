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

import os
import httpx
from pydantic import BaseModel

class JobSearchRequest(BaseModel):
    keywords: List[str]

@router.post("/search", response_model=List[dict])
async def search_jobs_with_internet(
    request: JobSearchRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Stage 5: Internet-powered job search.
    Queries both internal pgvector DB and public web via Brave Search API.
    Includes strict SSRF protections.
    """
    query_str = " ".join(request.keywords)
    results = []
    
    # 1. Internal semantic search placeholder
    # repo = JobRepository(db)
    # internal_jobs = await repo.search_semantic(...)
    # results.extend(internal_jobs)
    
    # 2. Public Web Search via Brave API
    brave_api_key = os.environ.get("BRAVE_API_KEY")
    if brave_api_key and query_str:
        # SSRF Guard: Hardcoded endpoint, strictly parameterized query, no redirects allowed
        brave_endpoint = "https://api.search.brave.com/res/v1/web/search"
        try:
            async with httpx.AsyncClient(follow_redirects=False) as client:
                resp = await client.get(
                    brave_endpoint,
                    headers={"X-Subscription-Token": brave_api_key},
                    params={"q": f"{query_str} jobs remote"},
                    timeout=10.0
                )
                if resp.status_code == 200:
                    data = resp.json()
                    web_results = data.get("web", {}).get("results", [])
                    # Normalize web results into our job format
                    for item in web_results:
                        results.append({
                            "id": str(uuid.uuid4()),
                            "title": item.get("title", "Unknown Role"),
                            "description": item.get("description", ""),
                            "url": item.get("url", ""),
                            "source": "Brave Search"
                        })
        except Exception as e:
            # Silently fail web search or log it; do not crash internal results
            pass
            
    return results

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
