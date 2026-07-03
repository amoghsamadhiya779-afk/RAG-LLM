from app.core.idempotency import IdempotentRoute
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.session import get_db
from app.db.schemas import JobWithCompanyResponse, JobResponse, AdminStatsResponse, JobUpdate
from app.db.job_repo import JobRepository
from app.db.admin_repo import AdminRepository
from app.core.deps import require_user, require_role
from app.db.models import User, RoleEnum, JobStatusEnum

router = APIRouter(route_class=IdempotentRoute, prefix="/admin", tags=["admin"])

@router.get("/jobs", response_model=List[JobWithCompanyResponse])
async def get_pending_jobs(
    status: str = "pending",
    user: User = Depends(require_role([RoleEnum.admin])),
    db: AsyncSession = Depends(get_db)
):
    from app.db.schemas import JobFilters
    repo = JobRepository(db)
    
    # Using the standard JobRepository filter
    filters = JobFilters(status=JobStatusEnum(status))
    jobs, _ = await repo.get_all(filters, 1, 100) # page 1, max 100 for admin review
    return [JobWithCompanyResponse.model_validate(j) for j in jobs]

@router.patch("/jobs/{job_id}/status", response_model=JobResponse)
async def update_job_status(
    job_id: uuid.UUID,
    update_data: dict,
    user: User = Depends(require_role([RoleEnum.admin])),
    db: AsyncSession = Depends(get_db)
):
    new_status = update_data.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Missing status")
        
    repo = JobRepository(db)
    # create a simple JobUpdate model instance
    job_in = JobUpdate(status=JobStatusEnum(new_status))
    job = await repo.update(job_id, job_in)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return JobResponse.model_validate(job)

@router.get("/stats", response_model=AdminStatsResponse)
async def get_stats(
    user: User = Depends(require_role([RoleEnum.admin])),
    db: AsyncSession = Depends(get_db)
):
    repo = AdminRepository(db)
    stats = await repo.get_stats()
    return AdminStatsResponse(**stats)
