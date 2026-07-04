import os
import httpx
import logging
from typing import List
from datetime import datetime
from tenacity import retry, stop_after_attempt, wait_exponential
from app.db.schemas import RawJob
from app.core.config import settings

logger = logging.getLogger(__name__)

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def fetch_adzuna(what: str = "developer", country: str = "gb", pages: int = 1) -> List[RawJob]:
    app_id = settings.ADZUNA_APP_ID
    app_key = settings.ADZUNA_APP_KEY
    if not app_id or not app_key:
        logger.warning("Adzuna credentials not configured. Skipping.")
        return []

    jobs = []
    async with httpx.AsyncClient(timeout=15.0) as client:
        for page in range(1, pages + 1):
            url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/{page}"
            params = {
                "app_id": app_id,
                "app_key": app_key,
                "results_per_page": 50,
                "what": what,
            }
            try:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                for r in data.get("results", []):
                    # parse posted_at if available
                    posted_at = None
                    if "created" in r:
                        try:
                            # format: 2023-11-20T14:48:42Z
                            posted_at = datetime.fromisoformat(r["created"].replace("Z", "+00:00"))
                        except Exception:
                            pass
                    
                    job = RawJob(
                        source="adzuna",
                        external_id=str(r["id"]),
                        title=r.get("title", ""),
                        company=r.get("company", {}).get("display_name"),
                        location=r.get("location", {}).get("display_name"),
                        remote=False, # adzuna might not give this reliably, could parse from title
                        seniority=None,
                        tags=[r.get("category", {}).get("label")] if r.get("category", {}).get("label") else [],
                        salary_min=r.get("salary_min"),
                        salary_max=r.get("salary_max"),
                        currency="GBP" if country == "gb" else "USD", # simplify
                        description_html=r.get("description", ""),
                        apply_url=r.get("redirect_url"),
                        posted_at=posted_at
                    )
                    jobs.append(job)
            except Exception as e:
                logger.error(f"Error fetching from Adzuna: {e}")
                raise
    return jobs
