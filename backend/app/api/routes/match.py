from app.core.idempotency import IdempotentRoute
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.models import User
from app.core.deps import optional_user
from app.core.limits import check_rate_limit, check_guest_turnstile
from app.services.embeddings import embed_text
from app.db.repositories.jobs_repo import JobsRepository
from app.db.schemas import JobResponse

router = APIRouter(route_class=IdempotentRoute, prefix="/match", tags=["match"])

class MatchRequest(BaseModel):
    query: str

class MatchResponse(BaseModel):
    status: str
    jobs: List[JobResponse]

@router.post("", response_model=MatchResponse)
async def match_jobs(
    request: Request,
    payload: MatchRequest,
    user: User = Depends(optional_user),
    db: AsyncSession = Depends(get_db)
):
    if not user:
        await check_guest_turnstile(request)
        client_ip = request.client.host
        await check_rate_limit(f"ratelimit:match:{client_ip}", limit=20)
    else:
        await check_rate_limit(f"ratelimit:match:{user.id}", limit=100)

    # 1. Embed the query (resume or text)
    query_embedding = await embed_text(payload.query)

    # 2. Search jobs via pgvector
    jobs_repo = JobsRepository(db)
    matched_jobs = await jobs_repo.search_by_vector(query_embedding, k=50)

    # 3. Return jobs
    return MatchResponse(
        status="success",
        jobs=[JobResponse.model_validate(job) for job in matched_jobs]
    )
