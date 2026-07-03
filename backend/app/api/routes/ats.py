from app.core.idempotency import IdempotentRoute
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from app.core.security import optional_user, User
from app.core.limits import check_rate_limit, check_guest_turnstile, redis
from app.services.gemini import get_ats_score
import hashlib
import json

router = APIRouter(route_class=IdempotentRoute, prefix="/ats", tags=["ats"])

class ATSRequest(BaseModel):
    resume_text: str
    job_description: str
    job_id: str

@router.post("/score")
async def score_resume(
    request: Request,
    payload: ATSRequest,
    user: User = Depends(optional_user)
):
    if not user:
        await check_guest_turnstile(request)
        client_ip = request.client.host
        await check_rate_limit(f"ratelimit:ats:{client_ip}", limit=10)
    else:
        await check_rate_limit(f"ratelimit:ats:{user.id}", limit=50)

    # Cache check
    if redis:
        cache_key = f"ats:{hashlib.md5(payload.resume_text.encode()).hexdigest()}:{payload.job_id}"
        cached = redis.get(cache_key)
        if cached:
            return {"status": "success", "data": json.loads(cached)}

    score_result = await get_ats_score(payload.resume_text, payload.job_description)
    
    if redis:
        redis.setex(cache_key, 86400, score_result.model_dump_json())
        
    return {"status": "success", "data": score_result.model_dump()}
