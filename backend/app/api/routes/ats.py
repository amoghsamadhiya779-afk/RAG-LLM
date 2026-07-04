from app.core.idempotency import IdempotentRoute
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from app.db.models import User
from app.core.deps import optional_user
from app.core.limits import check_rate_limit, check_guest_turnstile, redis
from app.services.gemini import get_ats_score
from app.services.embeddings import embed_text
import hashlib
import json
import math

router = APIRouter(route_class=IdempotentRoute, prefix="/ats", tags=["ats"])

class ATSRequest(BaseModel):
    resume_text: str
    job_description: str
    job_id: str

def cosine_similarity(v1, v2):
    dot_product = sum(a * b for a, b in zip(v1, v2))
    magnitude = math.sqrt(sum(a * a for a in v1)) * math.sqrt(sum(b * b for b in v2))
    return dot_product / magnitude if magnitude else 0.0

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

    # 1. Gemini Rubric Score
    score_result = await get_ats_score(payload.resume_text, payload.job_description)
    
    # 2. Embeddings Cosine
    resume_embedding = await embed_text(payload.resume_text)
    job_embedding = await embed_text(payload.job_description)
    
    cos_sim = cosine_similarity(resume_embedding, job_embedding)
    # Blend: 70% Gemini, 30% Embeddings
    blended_score = int(score_result.score * 0.7 + (cos_sim * 100) * 0.3)
    score_result.score = min(max(blended_score, 0), 100)
    
    if redis:
        redis.setex(cache_key, 86400, score_result.model_dump_json())
        
    return {"status": "success", "data": score_result.model_dump()}
