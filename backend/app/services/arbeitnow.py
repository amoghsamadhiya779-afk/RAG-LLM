import httpx
import logging
from typing import List
from datetime import datetime
from tenacity import retry, stop_after_attempt, wait_exponential
from app.db.schemas import RawJob

logger = logging.getLogger(__name__)

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def fetch_arbeitnow() -> List[RawJob]:
    jobs = []
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            # Arbeitnow does not require an API key
            url = "https://www.arbeitnow.com/api/job-board-api"
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            
            for r in data.get("data", []):
                posted_at = None
                if "created_at" in r:
                    try:
                        # format: unix timestamp
                        posted_at = datetime.fromtimestamp(r["created_at"])
                    except Exception:
                        pass
                
                job = RawJob(
                    source="arbeitnow",
                    external_id=str(r.get("slug", "")),
                    title=r.get("title", ""),
                    company=r.get("company_name", ""),
                    location=r.get("location", ""),
                    remote=r.get("remote", False),
                    seniority=None,
                    tags=r.get("tags", []),
                    salary_min=None, # Arbeitnow usually doesn't provide min/max easily in free API
                    salary_max=None,
                    currency=None,
                    description_html=r.get("description", ""),
                    apply_url=r.get("url", ""),
                    posted_at=posted_at
                )
                jobs.append(job)
        except Exception as e:
            logger.error(f"Error fetching from Arbeitnow: {e}")
            raise
    return jobs
