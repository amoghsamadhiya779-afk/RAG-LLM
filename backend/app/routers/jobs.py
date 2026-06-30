import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.db.session import get_db
from app.schemas.schemas import JobCreate, JobUpdate, JobResponse, JobWithCompanyResponse, PaginatedResponse, JobFilters
from app.repositories.job_repo import JobRepository
from app.core.deps import get_current_user, require_role, get_current_profile
from app.models.models import User, Profile, RoleEnum
from app.core.config import settings

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
    Queries public web via Serper.
    """
    query_str = " ".join(request.keywords)
    results = []
    
    serper_api_key = settings.SERPER_API_KEY
    if serper_api_key and query_str:
        serper_endpoint = "https://google.serper.dev/search"
        try:
            async with httpx.AsyncClient(follow_redirects=False) as client:
                resp = await client.post(
                    serper_endpoint,
                    headers={
                        "X-API-KEY": serper_api_key,
                        "Content-Type": "application/json"
                    },
                    json={"q": query_str + " jobs"},
                    timeout=10.0
                )
                if resp.status_code == 200:
                    data = resp.json()
                    items = data.get("organic", [])
                    
                    for item in items:
                        results.append({
                            "id": str(uuid.uuid4()),
                            "title": item.get("title", "Unknown Role"),
                            "description": item.get("snippet") or "",
                            "url": item.get("link", ""),
                            "source": "Web Search",
                        })
        except Exception as e:
            print(f"Serper API Error: {e}")
            
    if not serper_api_key:
        raise HTTPException(status_code=400, detail="SERPER_API_KEY is not configured on the backend.")
        
    return results
    return results

@router.get("/search/semantic", response_model=List[JobWithCompanyResponse])
async def search_jobs_semantic(
    q: str = Query(..., description="The semantic search query"),
    location: Optional[str] = Query(None),
    salaryMin: Optional[float] = Query(None),
    remote: Optional[bool] = Query(None),
    jobType: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    tags: Optional[List[str]] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from app.models.models import Job, JobStatusEnum
    
    stmt = select(Job).options(selectinload(Job.company)).where(Job.status == JobStatusEnum.live)
    if location:
        stmt = stmt.where(Job.location.ilike(f"%{location}%"))
    if salaryMin is not None:
        stmt = stmt.where(Job.salary_min >= salaryMin)
    if remote is not None:
        stmt = stmt.where(Job.remote == remote)
    if jobType:
        stmt = stmt.where(Job.job_type == jobType)
    if level:
        stmt = stmt.where(Job.level == level)
    if tags:
        stmt = stmt.where(Job.tags.overlap(tags))
        
    result = await db.execute(stmt)
    jobs = list(result.scalars().all())
    
    if not jobs:
        return []
        
    langsearch_api_key = os.environ.get("LANGSEARCH_API_KEY")
    if not langsearch_api_key:
        return [JobWithCompanyResponse.model_validate(j) for j in jobs]
        
    documents = [
        f"Title: {j.title}\nCompany: {j.company.name if j.company else 'Unknown'}\nLocation: {j.location or 'Remote'}\nDescription: {j.description}\nRequirements: {', '.join(j.requirements or [])}"
        for j in jobs
    ]
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.langsearch.com/v1/rerank",
                headers={"Authorization": f"Bearer {langsearch_api_key}"},
                json={"query": q, "documents": documents},
                timeout=10.0
            )
            if resp.status_code == 200:
                data = resp.json()
                results_list = data.get("results", [])
                scores = {item["index"]: item.get("relevance_score", 0.0) for item in results_list}
                
                jobs_with_scores = []
                for idx, job in enumerate(jobs):
                    score = scores.get(idx, 0.0)
                    jobs_with_scores.append((job, score))
                    
                jobs_with_scores.sort(key=lambda x: x[1], reverse=True)
                sorted_jobs = [item[0] for item in jobs_with_scores]
                return [JobWithCompanyResponse.model_validate(j) for j in sorted_jobs]
    except Exception as e:
        pass
        
    return [JobWithCompanyResponse.model_validate(j) for j in jobs]

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
    api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return [JobWithCompanyResponse.model_validate(j) for j in jobs[:3]] # Fallback if no API key
        
    jobs_context = "\n\n".join([
        f"JOB_ID: {j.id}\nTitle: {j.title}\nCompany: {j.company.name if j.company else 'Unknown'}\nTags: {', '.join(j.tags or [])}\nRequirements: {', '.join(j.requirements or [])}" 
        for j in jobs
    ])
    
    resume_context = json.dumps(resume.parsed)
    
    try:
        from google import genai
        from google.genai import types
        
        model = settings.GEMINI_MODEL or "gemini-2.5-flash"
        genai_client = genai.Client(api_key=api_key)
        
        config = types.GenerateContentConfig(
            system_instruction="You are an ATS Matching engine. You will be provided with a parsed resume (JSON) and a list of live jobs. Select the top 3 best matching JOB_IDs for this candidate. Output ONLY a strict JSON array of strings containing the 3 UUIDs. Example: [\"uuid1\", \"uuid2\", \"uuid3\"]",
            response_mime_type="application/json"
        )
        
        resp = await genai_client.aio.models.generate_content(
            model=model,
            contents=f"--- PARSED RESUME ---\n{resume_context}\n\n--- LIVE JOBS ---\n{jobs_context}",
            config=config
        )
        content_text = resp.text
        if content_text:
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
