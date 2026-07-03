from app.core.idempotency import IdempotentRoute
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from app.core.security import optional_user, User
from app.core.limits import check_rate_limit, check_guest_turnstile

router = APIRouter(route_class=IdempotentRoute, prefix="/match", tags=["match"])

class MatchRequest(BaseModel):
    query: str

@router.post("")
async def match_jobs(
    request: Request,
    payload: MatchRequest,
    user: User = Depends(optional_user)
):
    if not user:
        await check_guest_turnstile(request)
        client_ip = request.client.host
        await check_rate_limit(f"ratelimit:match:{client_ip}", limit=20)
    else:
        await check_rate_limit(f"ratelimit:match:{user.id}", limit=100)

    # Mock matching response for now
    return {"status": "success", "message": "Matched jobs via pgvector cosine similarity top-50."}
