from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.models import Job, Application, Company, JobStatusEnum

class AdminRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_stats(self) -> dict:
        total_jobs = await self.db.execute(select(func.count()).select_from(Job))
        total_apps = await self.db.execute(select(func.count()).select_from(Application))
        total_comps = await self.db.execute(select(func.count()).select_from(Company))

        return {
            "total_jobs": total_jobs.scalar_one(),
            "live": total_jobs.scalar_one(), # all external jobs are live
            "pending": 0,
            "applications": total_apps.scalar_one(),
            "companies": total_comps.scalar_one()
        }
