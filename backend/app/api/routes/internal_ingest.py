import logging
import bleach
from fastapi import APIRouter, Header, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict

from app.core.config import settings
from app.db.session import get_db
from app.db.repositories.jobs_repo import JobsRepository
from app.services.adzuna import fetch_adzuna
from app.services.arbeitnow import fetch_arbeitnow
from app.services.embeddings import embed_text
from app.core.limits import check_rate_limit
from app.db.schemas import RawJob

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/internal/ingest", tags=["internal"])

def sanitize_html(html_text: str) -> str:
    if not html_text:
        return ""
    allowed_tags = ['b', 'i', 'u', 'strong', 'em', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a']
    allowed_attrs = {'a': ['href', 'title']}
    return bleach.clean(html_text, tags=allowed_tags, attributes=allowed_attrs)

def get_plain_text(html_text: str) -> str:
    if not html_text:
        return ""
    return bleach.clean(html_text, tags=[], attributes={}, strip=True)

@router.post("/run")
async def run_ingestion(
    x_cron_secret: str = Header(None, alias="X-Cron-Secret"),
    db: AsyncSession = Depends(get_db)
):
    if not x_cron_secret or x_cron_secret != settings.CRON_SECRET:
        raise HTTPException(status_code=401, detail="Invalid CRON Secret")

    raw_jobs = []

    # 1. Fetch Adzuna (with rate limit check)
    try:
        # 250 calls per day for Adzuna
        await check_rate_limit("adzuna_daily_calls", 250, 86400)
        adzuna_jobs = await fetch_adzuna(what="developer", country="gb", pages=1)
        raw_jobs.extend(adzuna_jobs)
        logger.info(f"Fetched {len(adzuna_jobs)} jobs from Adzuna")
    except Exception as e:
        logger.error(f"Failed to fetch Adzuna jobs: {e}")
        # Proceed even if Adzuna fails, e.g. rate limit

    # 2. Fetch Arbeitnow
    try:
        arbeitnow_jobs = await fetch_arbeitnow()
        raw_jobs.extend(arbeitnow_jobs)
        logger.info(f"Fetched {len(arbeitnow_jobs)} jobs from Arbeitnow")
    except Exception as e:
        logger.error(f"Failed to fetch Arbeitnow jobs: {e}")

    if not raw_jobs:
        return {"ingested": 0, "message": "No jobs fetched"}

    # 3. Normalize & Deduplicate
    unique_jobs: Dict[str, RawJob] = {}
    for job in raw_jobs:
        key = f"{job.source}:{job.external_id}"
        if key not in unique_jobs:
            job.description_html = sanitize_html(job.description_html)
            unique_jobs[key] = job

    normalized_jobs = list(unique_jobs.values())

    # 4. Generate embeddings
    for job in normalized_jobs:
        plain_desc = get_plain_text(job.description_html)
        text_for_embedding = f"{job.title} {job.company or ''} {plain_desc}"
        try:
            job.embedding = await embed_text(text_for_embedding)
        except Exception as e:
            logger.error(f"Failed to embed job {job.source}:{job.external_id}: {e}")
            # If embedding fails, we can assign a zero vector or skip. 
            # `embed_text` returns zero vector if empty, but we might want to skip.
            # Let's just use the fallback in embed_text or let it raise if critical.
            # Since `embed_text` raises on APIError, we'll catch and set to zeros.
            job.embedding = [0.0] * 768

    # 5. Upsert into database
    repo = JobsRepository(db)
    try:
        await repo.upsert_jobs(normalized_jobs)
    except Exception as e:
        logger.error(f"Failed to upsert jobs: {e}")
        raise HTTPException(status_code=500, detail="Database upsert failed")

    return {"ingested": len(normalized_jobs)}
