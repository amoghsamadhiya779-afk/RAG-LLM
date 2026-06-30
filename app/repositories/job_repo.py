import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.models.models import Job, Company, JobStatusEnum
from app.schemas.schemas import JobCreate, JobUpdate, JobFilters

class JobRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, filters: JobFilters, page: int = 1, page_size: int = 20) -> tuple[List[Job], int]:
        stmt = select(Job).options(selectinload(Job.company))
        
        if filters.status:
            stmt = stmt.where(Job.status == filters.status)
        if filters.remote is not None:
            stmt = stmt.where(Job.remote == filters.remote)
        if filters.job_type:
            stmt = stmt.where(Job.job_type == filters.job_type)
        if filters.level:
            stmt = stmt.where(Job.level == filters.level)
        if filters.featured is not None:
            stmt = stmt.where(Job.featured == filters.featured)
        if filters.salary_min is not None:
            stmt = stmt.where(Job.salary_min >= filters.salary_min)
            
        if filters.tags:
            # PostgreSQL array overlap operator
            stmt = stmt.where(Job.tags.overlap(filters.tags))

        # Order by featured first, then created_at
        stmt = stmt.order_by(desc(Job.featured), desc(Job.created_at))
        
        # Pagination
        from sqlalchemy import func
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = await self.db.execute(count_stmt)
        total_count = total.scalar_one()
        
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        
        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total_count

    async def get_by_id(self, job_id: uuid.UUID) -> Optional[Job]:
        stmt = select(Job).options(selectinload(Job.company)).where(Job.id == job_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_mine(self, owner_id: uuid.UUID) -> List[Job]:
        stmt = (
            select(Job)
            .options(selectinload(Job.company))
            .join(Company)
            .where(Company.owner_id == owner_id)
            .order_by(desc(Job.created_at))
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, job_in: JobCreate, embedding: list[float] = None) -> Job:
        job = Job(
            company_id=job_in.company_id,
            title=job_in.title,
            description=job_in.description,
            requirements=job_in.requirements,
            location=job_in.location,
            remote=job_in.remote,
            job_type=job_in.job_type,
            level=job_in.level,
            salary_min=job_in.salary_min,
            salary_max=job_in.salary_max,
            tags=job_in.tags,
            status=JobStatusEnum.pending,
            featured=False,
            embedding=embedding
        )
        self.db.add(job)
        await self.db.commit()
        await self.db.refresh(job)
        return job

    async def update(self, job_id: uuid.UUID, job_in: JobUpdate, new_embedding: list[float] = None) -> Optional[Job]:
        job = await self.get_by_id(job_id)
        if not job:
            return None
            
        for key, value in job_in.model_dump(exclude_unset=True).items():
            setattr(job, key, value)
            
        if new_embedding:
            job.embedding = new_embedding
            
        await self.db.commit()
        await self.db.refresh(job)
        return job

    async def search_semantic(self, qvec: list[float], limit: int = 20) -> List[Job]:
        # pgvector cosine similarity
        stmt = (
            select(Job)
            .options(selectinload(Job.company))
            .where(Job.status == JobStatusEnum.live)
            .order_by(desc(Job.featured), Job.embedding.cosine_distance(qvec))
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
