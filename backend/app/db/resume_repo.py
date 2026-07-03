import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.db.models import Resume

class ResumeRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_mine(self, user_id: uuid.UUID) -> List[Resume]:
        stmt = (
            select(Resume)
            .where(Resume.user_id == user_id)
            .order_by(desc(Resume.uploaded_at))
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, resume_id: uuid.UUID) -> Optional[Resume]:
        stmt = select(Resume).where(Resume.id == resume_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, user_id: uuid.UUID, file_name: str) -> Resume:
        resume = Resume(
            user_id=user_id,
            file_name=file_name
        )
        self.db.add(resume)
        await self.db.commit()
        await self.db.refresh(resume)
        return resume

    async def update_parsed(self, resume_id: uuid.UUID, parsed_data: dict, embedding: list[float] = None) -> Optional[Resume]:
        resume = await self.get_by_id(resume_id)
        if not resume:
            return None
            
        resume.parsed = parsed_data
        if embedding:
            resume.embedding = embedding
            
        await self.db.commit()
        await self.db.refresh(resume)
        return resume
