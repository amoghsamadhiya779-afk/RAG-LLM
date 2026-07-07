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

@router.get("/jobs/{job_id}/applications")
async def get_job_applications(
    job_id: uuid.UUID,
    user: User = Depends(require_role([RoleEnum.recruiter])),
    db: AsyncSession = Depends(get_db)
):
    repo = ApplicationRepository(db)
    apps = await repo.get_for_job(job_id)
    
    stage_map = {
        "applied": "new",
        "reviewing": "reviewed",
        "interview": "interview",
        "offer": "hired",
        "rejected": "rejected",
        "withdrawn": "rejected"
    }

    items = []
    for app in apps:
        usr = app.user
        profile = usr.profile if usr else None
        res = app.resume
        
        items.append({
            "id": str(app.id),
            "job_id": str(app.job_id),
            "candidate": {
                "id": str(usr.id) if usr else "",
                "full_name": profile.full_name if profile else "Unknown",
                "email": usr.email if usr else "",
                "avatar_url": profile.avatar_url if profile else None,
                "headline": profile.headline if profile else None,
                "location": profile.location if profile else None
            },
            "resume": {
                "id": str(res.id) if res else "",
                "filename": res.file_name if res else "",
                "storage_path": res.storage_path if res else "",
                "preview_url": None
            },
            "ats_score": 0,
            "matched_keywords": [],
            "missing_keywords": [],
            "cover_letter": app.cover_note,
            "stage": stage_map.get(app.stage.value if app.stage else "applied", "new"),
            "applied_at": app.created_at.isoformat() if app.created_at else None
        })

    return {
        "items": items,
        "total": len(items),
        "page": 1,
        "pageSize": max(len(items), 10)
    }

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

@router.patch("/applications/{application_id}")
async def update_application_status(
    application_id: uuid.UUID,
    app_in: ApplicationUpdate,
    user: User = Depends(require_role([RoleEnum.recruiter, RoleEnum.seeker])),
    db: AsyncSession = Depends(get_db)
):
    repo = ApplicationRepository(db)
    
    # Reverse map frontend stage to backend ApplicationStageEnum
    reverse_map = {
        "new": "applied",
        "reviewed": "reviewing",
        "interview": "interview",
        "hired": "offer",
        "rejected": "rejected",
        "withdrawn": "withdrawn"
    }
    
    backend_stage = reverse_map.get(app_in.stage, app_in.stage)
    
    # If user is a seeker, they can only set the stage to 'withdrawn'
    if user.profile.role == RoleEnum.seeker:
        if backend_stage != "withdrawn":
            raise HTTPException(status_code=403, detail="Seekers can only withdraw applications")
        app_model = await db.get(Application, application_id)
        if not app_model or app_model.user_id != user.id:
            raise HTTPException(status_code=404, detail="Application not found")

    from app.db.models import ApplicationStageEnum
    try:
        app_in.stage = ApplicationStageEnum(backend_stage)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid stage")

    application = await repo.update(application_id, app_in)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
        
    return {
        "id": str(application.id),
        "job_id": str(application.job_id),
        "user_id": str(application.user_id),
        "resume_id": str(application.resume_id) if application.resume_id else None,
        "cover_note": application.cover_note,
        "stage": application.stage.value if application.stage else None,
        "created_at": application.created_at.isoformat() if application.created_at else None
    }
