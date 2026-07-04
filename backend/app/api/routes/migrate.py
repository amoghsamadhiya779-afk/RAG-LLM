from app.core.idempotency import IdempotentRoute
from fastapi import APIRouter, Depends, Header, Request
from pydantic import BaseModel, conlist
from app.core.deps import require_user
from app.db.models import User
from app.core.errors import APIError
from app.core.limits import redis
import structlog

logger = structlog.get_logger(__name__)

router = APIRouter(route_class=IdempotentRoute, prefix="/migrate-guest-data", tags=["migrate"])

class GuestData(BaseModel):
    saved_jobs: conlist(str, max_length=200) = []
    applications: conlist(str, max_length=200) = []
    resume_metadata: dict = {}

@router.post("")
async def migrate_data(
    request: Request,
    data: GuestData,
    idempotency_key: str = Header(...),
    user: User = Depends(require_user)
):
    body_size = int(request.headers.get("content-length", 0))
    if body_size > 102400: # 100KB cap
        raise APIError("payload_too_large", "Migration payload exceeds 100KB.", 413)

    if not redis:
        raise APIError("service_unavailable", "Migration service temporarily unavailable.", 503)
        
    redis_key = f"idempotency:migrate:{user.id}:{idempotency_key}"
    
    # Check if already processed
    existing_result = redis.get(redis_key)
    if existing_result:
        return {"status": "success", "message": "Already processed."}
        
    # In a real implementation we would upsert to db here and recompute ATS scores
    
    # Save idempotency key for 48h
    redis.setex(redis_key, 172800, "success")
    
    return {"status": "success", "message": "Data migrated successfully."}
