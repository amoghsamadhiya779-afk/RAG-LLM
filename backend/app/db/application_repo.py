import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.db.models import Application, Job, Profile, Company
from app.db.schemas import ApplicationCreate, ApplicationUpdate

class ApplicationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, application_id: uuid.UUID) -> Optional[Application]:
        stmt = select(Application).where(Application.id == application_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_for_job(self, job_id: uuid.UUID) -> List[Application]:
        from sqlalchemy.orm import selectinload
        from app.db.models import User
        stmt = (
            select(Application)
            .where(Application.job_id == job_id)
            .options(
                selectinload(Application.user).selectinload(User.profile),
                selectinload(Application.resume)
            )
            .order_by(desc(Application.created_at))
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_mine(self, user_id: uuid.UUID) -> List[Application]:
        stmt = (
            select(Application)
            .where(Application.user_id == user_id)
            .options(selectinload(Application.job))
            .order_by(desc(Application.created_at))
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def check_existing(self, job_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        stmt = select(Application).where(
            Application.job_id == job_id,
            Application.user_id == user_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def create(self, user_id: uuid.UUID, app_in: ApplicationCreate) -> Application:
        app = Application(
            job_id=app_in.job_id,
            user_id=user_id,
            resume_id=app_in.resume_id,
            cover_note=app_in.cover_note
        )
        self.db.add(app)
        await self.db.commit()
        await self.db.refresh(app)
        return app

    async def update(self, application_id: uuid.UUID, app_in: ApplicationUpdate) -> Optional[Application]:
        app = await self.get_by_id(application_id)
        if not app:
            return None
            
        app.stage = app_in.stage
        await self.db.commit()
        await self.db.refresh(app)
        return app
