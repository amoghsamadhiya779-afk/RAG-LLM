import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import Company
from app.db.schemas import CompanyCreate, CompanyUpdate

class CompanyRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> List[Company]:
        result = await self.db.execute(select(Company))
        return list(result.scalars().all())

    async def get_by_id_or_slug(self, identifier: str) -> Optional[Company]:
        try:
            uid = uuid.UUID(identifier)
            stmt = select(Company).where(Company.id == uid)
        except ValueError:
            stmt = select(Company).where(Company.slug == identifier)
            
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, owner_id: uuid.UUID, company_in: CompanyCreate) -> Company:
        company = Company(
            owner_id=owner_id,
            slug=company_in.slug,
            name=company_in.name,
            website=company_in.website,
            logo_url=company_in.logo_url,
            about=company_in.about,
            location=company_in.location,
            size=company_in.size
        )
        self.db.add(company)
        await self.db.commit()
        await self.db.refresh(company)
        return company

    async def update(self, company_id: uuid.UUID, company_in: CompanyUpdate) -> Optional[Company]:
        company = await self.get_by_id_or_slug(str(company_id))
        if not company:
            return None
            
        for key, value in company_in.model_dump(exclude_unset=True).items():
            setattr(company, key, value)
            
        await self.db.commit()
        await self.db.refresh(company)
        return company
