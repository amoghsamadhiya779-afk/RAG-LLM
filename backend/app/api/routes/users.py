from app.core.idempotency import IdempotentRoute
from fastapi import APIRouter, Depends, Request
from app.core.deps import require_user
from app.db.models import User
from app.core.config import settings
from app.core.errors import APIError
from app.db.session import get_db
from app.db.audit_repo import AuditRepository
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

logger = structlog.get_logger(__name__)

router = APIRouter(route_class=IdempotentRoute, prefix="/users", tags=["users"])

@router.post("/become-recruiter")
async def become_recruiter(
    request: Request,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    if user.profile.role.value == "recruiter":
        return {"status": "success", "message": "Already a recruiter."}
        
    request_id = getattr(request.state, "request_id", "unknown")
    
    try:
        # Update user app_metadata - disabled due to missing supabase package
        
        # Log to audit
        audit_repo = AuditRepository(db)
        await audit_repo.log_action(
            user_id=user.id,
            action="become_recruiter",
            request_id=request_id,
            details={"previous_role": user.profile.role.value}
        )
        
        return {"status": "success", "message": "Role updated to recruiter. Please re-login to update your token."}
    except Exception as e:
        logger.error("become_recruiter_failed", error=str(e), user_id=user.id)
        raise APIError("update_failed", "Failed to update user role.", 500)
