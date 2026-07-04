from app.core.idempotency import IdempotentRoute
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.session import get_db
from app.db.schemas import AdminStatsResponse
from app.db.admin_repo import AdminRepository
from app.core.deps import require_user, require_role
from app.db.models import User, RoleEnum

router = APIRouter(route_class=IdempotentRoute, prefix="/admin", tags=["admin"])

@router.get("/stats", response_model=AdminStatsResponse)
async def get_stats(
    user: User = Depends(require_role([RoleEnum.admin])),
    db: AsyncSession = Depends(get_db)
):
    repo = AdminRepository(db)
    stats = await repo.get_stats()
    return AdminStatsResponse(**stats)
