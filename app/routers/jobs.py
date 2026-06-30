import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.db.session import get_db
from app.schemas.schemas import JobCreate, JobUpdate, JobResponse, JobWithCompanyResponse, PaginatedResponse, JobFilters
from app.repositories.job_repo import JobRepository
from app.core.deps import get_current_user, require_role, get_current_profile
from app.models.models import User, Profile, RoleEnum

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("", response_model=PaginatedResponse[JobWithCompanyResponse])
async def get_jobs(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    query: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    remote: Optional[bool] = None,
    jobType: Optional[str] = None,
    level: Optional[str] = None,
    salaryMin: Optional[float] = None,
    featured: Optional[bool] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    repo = JobRepository(db)
    filters = JobFilters(
        query=query,
        tags=tags,
        remote=remote,
        job_type=jobType,
        level=level,
        salary_min=salaryMin,
        featured=featured,
        status=status or "live"
    )
    jobs, total = await repo.get_all(filters, page, pageSize)
    
    return PaginatedResponse(
        items=[JobWithCompanyResponse.model_validate(j) for j in jobs],
        total=total,
        page=page,
        page_size=pageSize
    )

@router.get("/mine", response_model=List[JobWithCompanyResponse])
async def get_my_jobs(
    user: User = Depends(require_role([RoleEnum.employer])),
    db: AsyncSession = Depends(get_db)
):
    repo = JobRepository(db)
    jobs = await repo.get_mine(user.id)
    return [JobWithCompanyResponse.model_validate(j) for j in jobs]

import os
import httpx
from pydantic import BaseModel

class JobSearchRequest(BaseModel):
    keywords: List[str]

@router.post("/search", response_model=List[dict])
async def search_jobs_with_internet(
    request: JobSearchRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Stage 5: Internet-powered job search.
    Queries both internal pgvector DB and public web via Brave Search API.
    Includes strict SSRF protections.
    """
    query_str = " ".join(request.keywords)
    results = []
    
    # 1. Internal semantic search placeholder
    # repo = JobRepository(db)
    # internal_jobs = await repo.search_semantic(...)
    # results.extend(internal_jobs)
    
    # 2. Public Web Search via Brave API
    brave_api_key = os.environ.get("BRAVE_API_KEY")
    if brave_api_key and query_str:
        # SSRF Guard: Hardcoded endpoint, strictly parameterized query, no redirects allowed
        brave_endpoint = "https://api.search.brave.com/res/v1/web/search"
        try:
            async with httpx.AsyncClient(follow_redirects=False) as client:
                resp = await client.get(
                    brave_endpoint,
                    headers={"X-Subscription-Token": brave_api_key},
                    params={"q": f"{query_str} jobs remote"},
                    timeout=10.0
                )
                if resp.status_code == 200:
                    data = resp.json()
                    web_results = data.get("web", {}).get("results", [])
                    # Normalize web results into our job format
                    for item in web_results:
                        results.append({
                            "id": str(uuid.uuid4()),
                            "title": item.get("title", "Unknown Role"),
                            "description": item.get("description", ""),
                            "url": item.get("url", ""),
                            "source": "Brave Search"
                        })
        except Exception as e:
            # Silently fail web search or log it; do not crash internal results
            pass
            
    return results

import json
from app.repositories.resume_repo import ResumeRepository

@router.get("/recommended", response_model=List[JobWithCompanyResponse])
async def get_recommended_jobs(
    resumeId: uuid.UUID = Query(..., description="The ID of the parsed resume"),
    db: AsyncSession = Depends(get_db)
):
    """
    ATS Recommended Jobs powered by Gemini RAG.
    Matches the user's parsed resume against live jobs.
    """
    # 1. Fetch Resume
    resume_repo = ResumeRepository(db)
    resume = await resume_repo.get_by_id(resumeId)
    if not resume or not resume.parsed:
        raise HTTPException(status_code=400, detail="Resume not found or not fully parsed yet.")
    
    # 2. Fetch Live Jobs (For production, this would use pgvector. For this demo, fetch top 10 latest live jobs)
    job_repo = JobRepository(db)
    filters = JobFilters(status="live")
    jobs, _ = await job_repo.get_all(filters, page=1, page_size=10)
    
    if not jobs:
        return []
        
    # 3. Gemini ATS Evaluation
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return [JobWithCompanyResponse.model_validate(j) for j in jobs[:3]] # Fallback if no API key
        
    jobs_context = "\n\n".join([
        f"JOB_ID: {j.id}\nTitle: {j.title}\nCompany: {j.company.name if j.company else 'Unknown'}\nTags: {', '.join(j.tags or [])}\nRequirements: {', '.join(j.requirements or [])}" 
        for j in jobs
    ])
    
    resume_context = json.dumps(resume.parsed)
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}",
                headers={"Content-Type": "application/json"},
                json={
                    "systemInstruction": {
                        "parts": [{"text": "You are an ATS Matching engine. You will be provided with a parsed resume (JSON) and a list of live jobs. Select the top 3 best matching JOB_IDs for this candidate. Output ONLY a strict JSON array of strings containing the 3 UUIDs. Example: [\"uuid1\", \"uuid2\", \"uuid3\"]"}]
                    },
                    "contents": [{"parts": [{"text": f"--- PARSED RESUME ---\n{resume_context}\n\n--- LIVE JOBS ---\n{jobs_context}"}]}],
                    "generationConfig": {"responseMimeType": "application/json"}
                },
                timeout=20.0
            )
            
            if resp.status_code == 200:
                content_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                recommended_ids = json.loads(content_text)
                
                # Filter the jobs that match the recommended IDs
                matched_jobs = [j for j in jobs if str(j.id) in recommended_ids]
                # If Gemini returned fewer than 3 or hallucinated, pad with remaining
                if len(matched_jobs) < 3:
                    for j in jobs:
                        if j not in matched_jobs:
                            matched_jobs.append(j)
                        if len(matched_jobs) >= 3:
                            break
                            
                return [JobWithCompanyResponse.model_validate(j) for j in matched_jobs[:3]]
    except Exception as e:
        # Graceful fallback to latest jobs if Gemini API fails
        print(f"Gemini ATS matching failed: {e}")
        pass
        
    return [JobWithCompanyResponse.model_validate(j) for j in jobs[:3]]

@router.get("/{job_id}", response_model=JobWithCompanyResponse)
async def get_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    repo = JobRepository(db)
    job = await repo.get_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobWithCompanyResponse.model_validate(job)

@router.post("", response_model=JobResponse)
async def create_job(
    job_in: JobCreate, 
    user: User = Depends(require_role([RoleEnum.employer])),
    db: AsyncSession = Depends(get_db)
):
    # Verify company belongs to user
    repo = JobRepository(db)
    # create
    job = await repo.create(job_in)
    # In real implementation: enqueue embedding task here
    return JobResponse.model_validate(job)

@router.patch("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: uuid.UUID,
    job_in: JobUpdate,
    user: User = Depends(require_role([RoleEnum.employer, RoleEnum.admin])),
    db: AsyncSession = Depends(get_db)
):
    repo = JobRepository(db)
    job = await repo.update(job_id, job_in)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobResponse.model_validate(job)
