from app.core.idempotency import IdempotentRoute
from fastapi import APIRouter, Header, Depends
import httpx
import bleach
import uuid
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.repositories import JobRepository
from app.services.embeddings import generate_embedding
from app.core.config import settings
from app.core.errors import APIError
from app.core.limits import redis
import structlog

logger = structlog.get_logger(__name__)

router = APIRouter(route_class=IdempotentRoute, prefix="/internal/ingest", tags=["ingest"])

async def verify_cron_secret(x_cron_secret: str = Header(...)):
    if x_cron_secret != settings.CRON_SECRET:
        raise APIError("unauthorized", "Invalid cron secret.", 401)
    return True

async def fetch_adzuna_jobs() -> List[Dict[str, Any]]:
    # Adzuna rate limit protection
    if redis:
        current = redis.incr("adzuna_daily_calls")
        if current == 1:
            redis.expire("adzuna_daily_calls", 86400)
        if current > 200:
            logger.warning("adzuna_budget_exhausted")
            return []
            
    url = f"https://api.adzuna.com/v1/api/jobs/us/search/1?app_id={settings.ADZUNA_APP_ID}&app_key={settings.ADZUNA_APP_KEY}&results_per_page=20"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, timeout=15.0)
            response.raise_for_status()
            data = response.json()
            return data.get("results", [])
    except Exception as e:
        logger.error("adzuna_fetch_failed", error=str(e))
        return []

def sanitize_html(html: str) -> str:
    if not html:
        return ""
    allowed_tags = ['p', 'b', 'i', 'u', 'em', 'strong', 'ul', 'ol', 'li', 'br']
    return bleach.clean(html, tags=allowed_tags, strip=True)

@router.post("/run", dependencies=[Depends(verify_cron_secret)])
async def run_ingestion(db: AsyncSession = Depends(get_db)):
    adzuna_results = await fetch_adzuna_jobs()
    
    normalized_jobs = []
    for aj in adzuna_results:
        description = sanitize_html(aj.get("description", ""))
        
        # Generate embedding
        embedding_text = f"{aj.get('title', '')} {aj.get('company', {}).get('display_name', '')} {description}"
        try:
            embedding = await generate_embedding(embedding_text)
        except Exception:
            embedding = None
            
        normalized_jobs.append({
            "id": f"adz_{aj.get('id')}",
            "title": aj.get("title"),
            "company": aj.get("company", {}).get("display_name", "Unknown"),
            "location": aj.get("location", {}).get("display_name"),
            "remote": False, # Basic assumption if not specified
            "description": description,
            "url": aj.get("redirect_url"),
            "source": "adzuna",
            "external_id": str(aj.get("id")),
            "embedding": embedding
        })
        
    if normalized_jobs:
        repo = JobRepository(db)
        await repo.upsert_jobs(normalized_jobs)
        
    return {"status": "success", "ingested": len(normalized_jobs)}
