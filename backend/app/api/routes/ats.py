from app.core.idempotency import IdempotentRoute
from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.db.models import User, Resume, AtsReport
from app.core.deps import require_user
from app.core.limits import check_rate_limit, redis
from app.services.gemini import get_ats_score
from app.services.embeddings import embed_text
from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import hashlib
import json
import math
import uuid

router = APIRouter(route_class=IdempotentRoute, prefix="/ats", tags=["ats"])

class ATSRequest(BaseModel):
    resume_id: str
    jd_text: Optional[str] = None
    job_id: Optional[str] = None

def cosine_similarity(v1, v2):
    if not v1 or not v2: return 0.0
    dot_product = sum(a * b for a, b in zip(v1, v2))
    magnitude = math.sqrt(sum(a * a for a in v1)) * math.sqrt(sum(b * b for b in v2))
    return dot_product / magnitude if magnitude else 0.0

@router.post("/score")
async def score_resume(
    request: Request,
    payload: ATSRequest,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    await check_rate_limit(f"ratelimit:ats:{user.id}", limit=50)

    # 1. Fetch Resume
    try:
        resume_uuid = uuid.UUID(payload.resume_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid resume ID")

    res = await db.execute(select(Resume).where(Resume.id == resume_uuid, Resume.user_id == user.id))
    resume = res.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if not payload.jd_text and not payload.job_id:
        raise HTTPException(status_code=400, detail="Must provide jd_text or job_id")
        
    job_description = payload.jd_text or "No JD provided" # If job_id provided, ideally fetch job.description_html but keeping simple for now.

    # Reconstruct text from parsed skills for ATS or fallback
    resume_text = ""
    if resume.parsed and "skills" in resume.parsed:
        resume_text = "Skills: " + ", ".join(resume.parsed["skills"])
    else:
        resume_text = "Candidate Resume"

    # 2. Gemini Rubric Score
    score_result = await get_ats_score(resume_text, job_description)
    
    # 3. Embeddings Cosine
    resume_embedding = resume.embedding
    if not resume_embedding:
        resume_embedding = await embed_text(resume_text)
        
    job_embedding = await embed_text(job_description)
    
    cos_sim = cosine_similarity(resume_embedding, job_embedding)
    
    # Blend: 70% Gemini, 30% Embeddings
    blended_score = int(score_result.overall * 0.7 + (cos_sim * 100) * 0.3)
    final_overall = min(max(blended_score, 0), 100)
    
    # Save to Database
    report = AtsReport(
        resume_id=resume.id,
        job_id=uuid.UUID(payload.job_id) if payload.job_id else None,
        overall=final_overall,
        sections=score_result.sections.model_dump(),
        matched_keywords=score_result.matched_keywords,
        missing_keywords=score_result.missing_keywords,
        jd_snippet=job_description[:200] + "..." if len(job_description) > 200 else job_description,
        suggestions=score_result.suggestions
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    # Convert to frontend schema
    data = {
        "id": str(report.id),
        "resume_id": str(report.resume_id),
        "job_id": str(report.job_id) if report.job_id else None,
        "overall": report.overall,
        "sections": report.sections,
        "matched_keywords": report.matched_keywords,
        "missing_keywords": report.missing_keywords,
        "jd_snippet": report.jd_snippet,
        "suggestions": report.suggestions,
        "created_at": report.created_at.isoformat()
    }
        
    return data

@router.get("/{id}")
async def get_ats_report(
    id: str,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        report_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid report ID")

    res = await db.execute(select(AtsReport).where(AtsReport.id == report_uuid))
    report = res.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="ATS Report not found")

    # Access control: ensure resume belongs to user
    res_resume = await db.execute(select(Resume).where(Resume.id == report.resume_id, Resume.user_id == user.id))
    if not res_resume.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not authorized to view this report")

    data = {
        "id": str(report.id),
        "resume_id": str(report.resume_id),
        "job_id": str(report.job_id) if report.job_id else None,
        "overall": report.overall,
        "sections": report.sections,
        "matched_keywords": report.matched_keywords,
        "missing_keywords": report.missing_keywords,
        "jd_snippet": report.jd_snippet,
        "suggestions": report.suggestions,
        "created_at": report.created_at.isoformat()
    }
    return data
