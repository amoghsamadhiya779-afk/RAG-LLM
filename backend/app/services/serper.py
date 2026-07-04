import httpx
import structlog
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.core.errors import APIError

logger = structlog.get_logger(__name__)

async def search_web(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Perform a web search using Serper (or Tavily) to augment RAG context.
    Degrades gracefully by returning an empty list if no API key is provided.
    """
    # Use SERPER_API_KEY if available, else gracefully degrade.
    # Check if we should fall back to TAVILY_API_KEY if user uses that.
    # For now we'll check for SERPER_API_KEY since it's in the architecture.
    api_key = getattr(settings, "SERPER_API_KEY", None)
    if not api_key:
        logger.debug("serper_key_missing", msg="Skipping web search because SERPER_API_KEY is not configured.")
        return []
        
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "https://google.serper.dev/search",
                headers={
                    "X-API-KEY": api_key,
                    "Content-Type": "application/json"
                },
                json={
                    "q": query,
                    "num": limit
                }
            )
            response.raise_for_status()
            data = response.json()
            
            # Extract organic results
            results = data.get("organic", [])
            
            return [
                {
                    "title": r.get("title", ""),
                    "link": r.get("link", ""),
                    "snippet": r.get("snippet", "")
                }
                for r in results[:limit]
            ]
    except Exception as e:
        logger.warning("serper_search_failed", error=str(e), query=query)
        # We don't want to crash the chat if web search fails, so we degrade gracefully
        return []

from datetime import datetime
from app.db.schemas import RawJob
import uuid

async def search_jobs_web(query: str, limit: int = 10) -> List[RawJob]:
    """
    Perform a web search using Serper specifically tailored for job hunting,
    mapping the organic results to the RawJob schema.
    """
    api_key = getattr(settings, "SERPER_API_KEY", None)
    if not api_key:
        logger.debug("serper_key_missing", msg="Skipping job web search because SERPER_API_KEY is not configured.")
        return []
        
    try:
        # Append "jobs" to query if it doesn't have it to ensure we get job listings
        search_query = query if "job" in query.lower() else f"{query} jobs"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "https://google.serper.dev/search",
                headers={
                    "X-API-KEY": api_key,
                    "Content-Type": "application/json"
                },
                json={
                    "q": search_query,
                    "num": limit
                }
            )
            response.raise_for_status()
            data = response.json()
            
            results = data.get("organic", [])
            jobs = []
            
            for r in results[:limit]:
                # Attempt to extract company name from the title or snippet.
                # Often titles are like "Software Engineer - Google - LinkedIn"
                title = r.get("title", "")
                company = "Web Search Result"
                parts = title.split(" - ")
                if len(parts) > 1:
                    company = parts[1].strip()
                
                # We generate a deterministic pseudo-ID based on the URL so we can upsert safely
                url = r.get("link", "")
                
                job = RawJob(
                    source="serper_web",
                    external_id=url,  # using URL as external ID ensures uniqueness
                    title=title,
                    company=company,
                    location=None,
                    remote=False,
                    seniority=None,
                    tags=["Web Search"],
                    salary_min=None,
                    salary_max=None,
                    currency=None,
                    description_html=r.get("snippet", ""),
                    apply_url=url,
                    posted_at=datetime.utcnow()
                )
                jobs.append(job)
                
            return jobs
    except Exception as e:
        logger.warning("serper_job_search_failed", error=str(e), query=query)
        return []
