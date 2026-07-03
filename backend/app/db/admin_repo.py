from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.models import Job, Application, Company, JobStatusEnum

class AdminRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_stats(self) -> dict:
        total_jobs = await self.db.execute(select(func.count()).select_from(Job))
        live_jobs = await self.db.execute(select(func.count()).select_from(Job).where(Job.status == JobStatusEnum.live))
        pending_jobs = await self.db.execute(select(func.count()).select_from(Job).where(Job.status == JobStatusEnum.pending))
        total_apps = await self.db.execute(select(func.count()).select_from(Application))
        total_comps = await self.db.execute(select(func.count()).select_from(Company))

        return {
            "total_jobs": total_jobs.scalar_one(),
            "live": live_jobs.scalar_one(),
            "pending": pending_jobs.scalar_one(),
            "applications": total_apps.scalar_one(),
            "companies": total_comps.scalar_one()
        }
