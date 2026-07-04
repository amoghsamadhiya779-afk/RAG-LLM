import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.dialects.postgresql import insert
from app.db.models import Job
from app.db.schemas import JobFilters, RawJob

class JobsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def upsert_jobs(self, jobs: List[RawJob]) -> None:
        if not jobs:
            return
            
        stmt = insert(Job).values([
            {
                "source": job.source,
                "external_id": job.external_id,
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "remote": job.remote,
                "seniority": job.seniority,
                "tags": job.tags,
                "salary_min": job.salary_min,
                "salary_max": job.salary_max,
                "currency": job.currency,
                "description_html": job.description_html,
                "apply_url": job.apply_url,
                "posted_at": job.posted_at,
                "embedding": job.embedding,
            }
            for job in jobs
        ])
        
        update_dict = {
            c.name: c
            for c in stmt.excluded
            if c.name not in ('id', 'source', 'external_id', 'created_at')
        }
        
        stmt = stmt.on_conflict_do_update(
            index_elements=['source', 'external_id'],
            set_=update_dict
        )
        
        await self.db.execute(stmt)
        await self.db.commit()

    def _build_filter_stmt(self, filters: JobFilters):
        from sqlalchemy import or_
        stmt = select(Job)
        
        if filters.q:
            search_term = f"%{filters.q}%"
            stmt = stmt.where(or_(
                Job.title.ilike(search_term), 
                Job.company.ilike(search_term),
                Job.location.ilike(search_term)
            ))
            
        if filters.location:
            stmt = stmt.where(Job.location.ilike(f"%{filters.location}%"))
        if filters.remote is not None:
            stmt = stmt.where(Job.remote == filters.remote)
        if filters.seniority:
            stmt = stmt.where(Job.seniority == filters.seniority)
        if filters.salary_min is not None:
            stmt = stmt.where(Job.salary_min >= filters.salary_min)
            
        if filters.tags:
            stmt = stmt.where(Job.tags.overlap(filters.tags))
            
        return stmt

    async def count_jobs(self, filters: JobFilters) -> int:
        from sqlalchemy import func
        stmt = self._build_filter_stmt(filters).with_only_columns(func.count(Job.id))
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def query_jobs_with_count(self, filters: JobFilters, limit: int = 50, offset: int = 0) -> tuple[List[Job], int]:
        from sqlalchemy import func
        stmt = self._build_filter_stmt(filters)
        total_count = func.count().over().label("total_count")
        stmt = stmt.add_columns(total_count)
        stmt = stmt.order_by(desc(Job.posted_at), desc(Job.id)).limit(limit).offset(offset)
        
        result = await self.db.execute(stmt)
        rows = result.all()
        jobs = [row[0] for row in rows]
        total = rows[0][1] if rows else 0
        return jobs, total

    async def get_job(self, job_id: uuid.UUID) -> Optional[Job]:
        stmt = select(Job).where(Job.id == job_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def search_by_vector(self, embedding: List[float], k: int = 50) -> List[Job]:
        # Using vector_cosine_ops (<=>) for order_by
        stmt = select(Job).order_by(Job.embedding.cosine_distance(embedding)).limit(k)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
