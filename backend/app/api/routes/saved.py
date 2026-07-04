import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.db.session import get_db
from app.db.schemas import JobResponse, PaginatedResponse
from app.db.models import SavedJob, Job, User
from app.core.deps import require_user

router = APIRouter(prefix="/saved", tags=["saved"])

@router.get("", response_model=PaginatedResponse[JobResponse])
async def get_saved_jobs(
    limit: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    offset = (page - 1) * limit
    
    from sqlalchemy import func
    
    stmt = (
        select(Job)
        .join(SavedJob, SavedJob.job_id == Job.id)
        .where(SavedJob.user_id == user.id)
    )
    
    total_count = func.count().over().label("total_count")
    stmt = stmt.add_columns(total_count)
    stmt = stmt.order_by(SavedJob.created_at.desc()).offset(offset).limit(limit)
    
    result = await db.execute(stmt)
    rows = result.all()
    jobs = [row[0] for row in rows]
    total = rows[0][1] if rows else 0
    
    return PaginatedResponse(
        items=[JobResponse.model_validate(j) for j in jobs],
        total=total,
        page=page,
        page_size=limit
    )

from pydantic import BaseModel
class SaveJobRequest(BaseModel):
    job_id: uuid.UUID

@router.post("/{job_id}")
async def save_job(
    job_id: uuid.UUID,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if already saved
    stmt = select(SavedJob).where(SavedJob.user_id == user.id, SavedJob.job_id == job_id)
    result = await db.execute(stmt)
    if result.scalars().first():
        return {"saved": True}
        
    saved = SavedJob(user_id=user.id, job_id=job_id)
    db.add(saved)
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Invalid job ID")
    return {"saved": True}

@router.delete("/{job_id}")
async def unsave_job(
    job_id: uuid.UUID,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = delete(SavedJob).where(SavedJob.user_id == user.id, SavedJob.job_id == job_id)
    await db.execute(stmt)
    await db.commit()
    return {"saved": False}
