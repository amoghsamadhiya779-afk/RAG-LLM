from app.core.idempotency import IdempotentRoute
from fastapi import APIRouter, Depends, Request
from app.core.deps import require_user, get_current_profile
from app.db.models import User, Profile, RoleEnum
from app.core.config import settings
from app.core.errors import APIError
from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

logger = structlog.get_logger(__name__)

router = APIRouter(route_class=IdempotentRoute, prefix="/users", tags=["users"])

@router.post("/become-recruiter")
async def become_recruiter(
    request: Request,
    user: User = Depends(require_user),
    profile: Profile = Depends(get_current_profile),
    db: AsyncSession = Depends(get_db)
):
    if profile.role.value == "employer":
        return {"status": "success", "message": "Already a recruiter."}
        
    request_id = getattr(request.state, "request_id", "unknown")
    
    try:
        profile.role = RoleEnum.recruiter
        db.add(profile)
        await db.commit()
        
        return {"status": "success", "role": "employer", "message": "Role updated to recruiter. Please re-login to update your token."}
    except Exception as e:
        await db.rollback()
        logger.error("become_recruiter_failed", error=str(e), user_id=str(profile.user_id))
        raise APIError("update_failed", "Failed to update user role.", 500)
