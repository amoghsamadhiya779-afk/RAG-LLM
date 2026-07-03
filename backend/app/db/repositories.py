from sqlalchemy import select, and_, or_, cast, String
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert
from typing import List, Optional, Dict, Any
from app.db.models import Job, AuditLog, ResumeMetadata

class JobRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_jobs(self, 
                      query: Optional[str] = None, 
                      location: Optional[str] = None,
                      remote: Optional[bool] = None,
                      seniority: Optional[str] = None,
                      limit: int = 20, 
                      after_id: Optional[str] = None) -> List[Job]:
        
        stmt = select(Job).order_by(Job.created_at.desc(), Job.id.desc())
        
        filters = []
        if query:
            filters.append(Job.title.ilike(f"%{query}%"))
        if location:
            filters.append(Job.location.ilike(f"%{location}%"))
        if remote is not None:
            filters.append(Job.remote == remote)
        if seniority:
            filters.append(Job.seniority == seniority)
            
        if filters:
            stmt = stmt.where(and_(*filters))
            
        if after_id:
            # Simple cursor implementation assuming ordering by (created_at DESC, id DESC)
            # For a proper keyset, we'd need the created_at of the cursor, but this is a simplified version.
            stmt = stmt.where(Job.id < after_id)
            
        stmt = stmt.limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
        
    async def get_job_by_id(self, job_id: str) -> Optional[Job]:
        stmt = select(Job).where(Job.id == job_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
        
    async def upsert_jobs(self, jobs_data: List[Dict[str, Any]]):
        if not jobs_data:
            return
            
        stmt = insert(Job).values(jobs_data)
        
        # On conflict update description, tags, url, updated_at
        update_dict = {
            "title": stmt.excluded.title,
            "company": stmt.excluded.company,
            "description": stmt.excluded.description,
            "tags": stmt.excluded.tags,
            "url": stmt.excluded.url,
            "embedding": stmt.excluded.embedding,
        }
        
        stmt = stmt.on_conflict_do_update(
            index_elements=['source', 'external_id'],
            set_=update_dict
        )
        
        await self.session.execute(stmt)
        await self.session.commit()

class AuditRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
        
    async def log_action(self, user_id: str, action: str, request_id: str, details: dict = None):
        log = AuditLog(
            user_id=user_id,
            action=action,
            request_id=request_id,
            details=details or {}
        )
        self.session.add(log)
        await self.session.commit()
