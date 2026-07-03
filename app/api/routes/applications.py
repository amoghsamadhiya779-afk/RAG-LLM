from app.core.idempotency import IdempotentRoute
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.session import get_db
from app.schemas.schemas import ApplicationCreate, ApplicationUpdate, ApplicationResponse, ApplicationWithRelationsResponse
from app.repositories.application_repo import ApplicationRepository
from app.core.deps import require_user, require_role
from app.models.models import User, RoleEnum

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
    user: User = Depends(require_role([RoleEnum.employer])),
    db: AsyncSession = Depends(get_db)
):
    repo = ApplicationRepository(db)
    apps = await repo.get_for_job(job_id)
    return [ApplicationWithRelationsResponse.model_validate(a) for a in apps]

@router.get("/applications/mine", response_model=List[ApplicationWithRelationsResponse])
async def get_my_applications(
    user: User = Depends(require_role([RoleEnum.seeker])),
    db: AsyncSession = Depends(get_db)
):
    repo = ApplicationRepository(db)
    apps = await repo.get_mine(user.id)
    return [ApplicationWithRelationsResponse.model_validate(a) for a in apps]

@router.patch("/applications/{application_id}", response_model=ApplicationResponse)
async def update_application_status(
    application_id: uuid.UUID,
    app_in: ApplicationUpdate,
    user: User = Depends(require_role([RoleEnum.employer])),
    db: AsyncSession = Depends(get_db)
):
    repo = ApplicationRepository(db)
    application = await repo.update(application_id, app_in)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return ApplicationResponse.model_validate(application)
