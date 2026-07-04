from app.core.idempotency import IdempotentRoute
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.session import get_db
from app.db.schemas import CompanyCreate, CompanyUpdate, CompanyResponse
from app.db.company_repo import CompanyRepository
from app.core.deps import require_user, require_role
from app.db.models import User, RoleEnum

router = APIRouter(route_class=IdempotentRoute, prefix="/companies", tags=["companies"])

@router.get("", response_model=List[CompanyResponse])
async def get_companies(db: AsyncSession = Depends(get_db)):
    repo = CompanyRepository(db)
    companies = await repo.get_all()
    return [CompanyResponse.model_validate(c) for c in companies]

@router.get("/{identifier}", response_model=CompanyResponse)
async def get_company(identifier: str, db: AsyncSession = Depends(get_db)):
    repo = CompanyRepository(db)
    company = await repo.get_by_id_or_slug(identifier)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return CompanyResponse.model_validate(company)

@router.post("", response_model=CompanyResponse)
async def create_company(
    company_in: CompanyCreate,
    user: User = Depends(require_role([RoleEnum.recruiter])),
    db: AsyncSession = Depends(get_db)
):
    repo = CompanyRepository(db)
    company = await repo.create(user.id, company_in)
    return CompanyResponse.model_validate(company)

@router.put("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: uuid.UUID,
    company_in: CompanyUpdate,
    user: User = Depends(require_role([RoleEnum.recruiter, RoleEnum.admin])),
    db: AsyncSession = Depends(get_db)
):
    repo = CompanyRepository(db)
    # verify ownership or admin in full implementation
    company = await repo.update(company_id, company_in)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return CompanyResponse.model_validate(company)
