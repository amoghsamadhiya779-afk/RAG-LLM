from app.core.idempotency import IdempotentRoute
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.session import get_db
from app.db.schemas import ApplicationCreate, ApplicationUpdate, ApplicationResponse, ApplicationWithRelationsResponse
from app.db.application_repo import ApplicationRepository
from app.core.deps import require_user, require_role
from app.db.models import User, RoleEnum, Application

router = APIRouter(route_class=IdempotentRoute, prefix="", tags=["applications"])

@router.post("/jobs/{job_id}/applications", response_model=ApplicationResponse)
async def create_application(
    job_id: uuid.UUID,
    app_in: ApplicationCreate,
    user: User = Depends(require_role([RoleEnum.seeker])),
    db: AsyncSession = Depends(get_db)
):
    repo = ApplicationRepository(db)
    exists = await repo.check_existing(job_id, user.id)
    if exists:
        raise HTTPException(status_code=409, detail="Already applied to this job")
        
    app_in.job_id = job_id
    application = await repo.create(user.id, app_in)
    return ApplicationResponse.model_validate(application)

@router.get("/jobs/{job_id}/applications", response_model=List[ApplicationWithRelationsResponse])
async def get_job_applications(
    job_id: uuid.UUID,
    user: User = Depends(require_role([RoleEnum.recruiter])),
    db: AsyncSession = Depends(get_db)
):
    repo = ApplicationRepository(db)
    apps = await repo.get_for_job(job_id)
    return [ApplicationWithRelationsResponse.model_validate(a) for a in apps]

@router.get("/applications/mine")
async def get_my_applications(
    user: User = Depends(require_role([RoleEnum.seeker])),
    db: AsyncSession = Depends(get_db)
):
    repo = ApplicationRepository(db)
    apps = await repo.get_mine(user.id)
    
    stage_map = {
        "applied": "submitted",
        "reviewing": "in_review",
        "interview": "interview",
        "offer": "hired",
        "rejected": "rejected",
        "withdrawn": "withdrawn"
    }

    items = []
    for app in apps:
        job = app.job
        job_dict = {
            "id": str(job.id) if job else "",
            "source": job.source if job else "unknown",
            "title": job.title if job else "Untitled",
            "company": job.company if job else "Unknown",
            "location": job.location if job else "Unknown",
            "remote": job.remote if job else False,
            "seniority": job.seniority if job else None,
            "employment_type": None,
            "job_type": None,
            "level": job.seniority if job else None,
            "tags": getattr(job, 'tags', []) or [],
            "description_md": getattr(job, 'description_html', None) or "",
            "apply_url": getattr(job, 'apply_url', None),
            "salary_min": getattr(job, 'salary_min', None),
            "salary_max": getattr(job, 'salary_max', None),
            "currency": getattr(job, 'currency', None),
            "status": "live",
            "is_featured": False,
            "featured_until": None,
            "created_at": job.created_at.isoformat() if job and job.created_at else None
        }

        items.append({
            "id": str(app.id),
            "job": job_dict,
            "resume_id": str(app.resume_id) if app.resume_id else None,
            "cover_letter": app.cover_note,
            "status": stage_map.get(app.stage.value, "submitted") if app.stage else "submitted",
            "created_at": app.created_at.isoformat() if app.created_at else None
        })

    return {
        "items": items,
        "total": len(items),
        "page": 1,
        "pageSize": max(len(items), 20)
    }

@router.patch("/applications/{application_id}", response_model=ApplicationResponse)
async def update_application_status(
    application_id: uuid.UUID,
    app_in: ApplicationUpdate,
    user: User = Depends(require_role([RoleEnum.recruiter, RoleEnum.seeker])),
    db: AsyncSession = Depends(get_db)
):
    repo = ApplicationRepository(db)
    # If user is a seeker, they can only set the stage to 'withdrawn'
    if user.profile.role == RoleEnum.seeker:
        if app_in.stage != "withdrawn":
            raise HTTPException(status_code=403, detail="Seekers can only withdraw applications")
        # Also need to check if they own the application (handled by repo if we add user_id check, but let's fetch it first)
        app_model = await db.get(Application, application_id)
        if not app_model or app_model.user_id != user.id:
            raise HTTPException(status_code=404, detail="Application not found")

    application = await repo.update(application_id, app_in)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return ApplicationResponse.model_validate(application)
