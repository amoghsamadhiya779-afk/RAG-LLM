from fastapi import APIRouter, Depends, Query, Request
from app.services.serper import search_jobs_web
from app.core.limits import check_guest_limits, check_ai_budget, redis
from app.core.deps import optional_user
from typing import Dict, Any
import json

router = APIRouter()

@router.get("/web")
async def search_web(
    request: Request,
    q: str = Query(..., min_length=2),
    user = Depends(optional_user)
):
    # Enforce rate limit (strict IP limit for guests + auth)
    await check_guest_limits(request)
    
    # Enforce daily AI budget
    await check_ai_budget(tokens=1)
    
    # Redis cache check (1 hour)
    cache_key = f"web-search:{q.lower().strip()}"
    if redis:
        cached = redis.get(cache_key)
        if cached:
            return json.loads(cached)
            
    # Execute search
    results = await search_jobs_web(q, limit=5)
    
    # Adzuna enrichment is deferred per approval, so we just return results
    response = {"items": results}
    
    # Cache the result
    if redis:
        redis.setex(cache_key, 3600, json.dumps(response))
        
    return response
