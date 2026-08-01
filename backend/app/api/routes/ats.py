import hashlib
import re
import uuid
from typing import Optional, List, Dict
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import json
import structlog

from app.core.idempotency import IdempotentRoute
from app.core.deps import require_user, require_role
from app.core.limits import check_rate_limit, redis
from app.db.session import get_db, AsyncSessionLocal
from app.db.models import User, Resume, Job, AtsReport, RoleEnum
from app.core.gemini_client import get_gemini_client
from app.core.config import settings

logger = structlog.get_logger(__name__)

router = APIRouter(route_class=IdempotentRoute, prefix="/ats", tags=["ats"])

ATS_GEMINI_CACHE_TTL = 7 * 86400  # 7 days - same resume+JD pairing gets an instant repeat score


def _ats_gemini_cache_key(resume_id: uuid.UUID, jd_text: str, model: str) -> str:
    digest = hashlib.sha256(f"{resume_id}:{model}:{jd_text}".encode("utf-8")).hexdigest()
    return f"ats_gemini_cache:{digest}"

class AtsScoreRequest(BaseModel):
    resume_id: str
    job_id: Optional[str] = None
    jd_text: Optional[str] = None

class GeminiResponse(BaseModel):
    experience_relevance: int
    strengths: List[str]
    gaps: List[str]
    suggestions: List[str]

# Common skills list for deterministic matching
COMMON_SKILLS = {"react", "python", "javascript", "typescript", "node", "java", "c++", "c#", "aws", "docker", "kubernetes", "sql", "nosql", "postgres", "mongodb", "git", "ci/cd", "agile", "scrum", "html", "css", "vue", "angular", "ruby", "php", "go", "rust", "swift", "kotlin", "spring", "django", "flask", "express", "graphql", "rest", "linux", "unix", "bash", "powershell", "azure", "gcp"}

async def _enrich_ats_report_with_gemini(
    report_id: uuid.UUID,
    resume_id: uuid.UUID,
    parsed: dict,
    jd_text: str,
    keywords_score: int,
    formatting_score: int,
    education_score: int,
    missing_keywords: List[str],
):
    """Runs the slow Gemini call in the background and merges the result into
    the AtsReport row that was already returned to the client. Uses its own
    DB session since the request-scoped session may already be closed by the
    time this runs."""
    gemini_score = 50
    suggestions: List[str] = []
    ai_feedback_available = False

    api_key = settings.GEMINI_API_KEY
    model = settings.GEMINI_MODEL
    cache_key = _ats_gemini_cache_key(resume_id, jd_text, model)

    cached = None
    if redis:
        try:
            cached_raw = await redis.get(cache_key)
            if cached_raw:
                cached = json.loads(cached_raw)
        except Exception as e:
            logger.warning("ats_gemini_cache_read_failed", error=str(e))

    if cached:
        gemini_score = cached["gemini_score"]
        suggestions = cached["suggestions"]
        ai_feedback_available = cached["ai_feedback_available"]
    elif api_key:
        try:
            from google.genai import types
            genai_client = get_gemini_client()

            config = types.GenerateContentConfig(
                system_instruction="You are an expert ATS scorer. Analyze the resume against the JD. Output JSON with: experience_relevance (int 0-100), strengths (list of str), gaps (list of str), suggestions (list of str).",
                response_mime_type="application/json",
                temperature=0.0
            )

            resp = await genai_client.aio.models.generate_content(
                model=model,
                contents=f"RESUME:\n{json.dumps(parsed)}\n\nJD:\n{jd_text}",
                config=config
            )

            res_data = json.loads(resp.text)
            gemini_score = int(res_data.get("experience_relevance", 50))
            suggestions = res_data.get("suggestions", [])
            ai_feedback_available = True

            if redis:
                try:
                    await redis.setex(cache_key, ATS_GEMINI_CACHE_TTL, json.dumps({
                        "gemini_score": gemini_score,
                        "suggestions": suggestions,
                        "ai_feedback_available": ai_feedback_available,
                    }))
                except Exception as e:
                    logger.warning("ats_gemini_cache_write_failed", error=str(e))
        except Exception as e:
            logger.warning("ats_gemini_enrichment_failed", error=str(e))
            suggestions = [f"Consider adding '{k}' to your resume to better match this job." for k in missing_keywords[:3]]
            if not suggestions:
                suggestions = ["Tailor your resume more specifically to the job description."]
    else:
        suggestions = [f"Consider adding '{k}' to your resume to better match this job." for k in missing_keywords[:3]]
        if not suggestions:
            suggestions = ["Tailor your resume more specifically to the job description."]

    deterministic_overall = (keywords_score + formatting_score + education_score) / 3.0
    overall = int((deterministic_overall * 0.6) + (gemini_score * 0.4))

    async with AsyncSessionLocal() as db:
        res = await db.execute(select(AtsReport).where(AtsReport.id == report_id))
        report_row = res.scalar_one_or_none()
        if not report_row:
            return

        data = dict(report_row.report)
        data["overall"] = overall
        data["sections"] = {**data.get("sections", {}), "experience": gemini_score}
        data["suggestions"] = suggestions
        data["ai_feedback_available"] = ai_feedback_available
        data["ai_status"] = "ready"
        report_row.report = data
        await db.commit()


@router.post("/score")
async def score_resume(
    payload: AtsScoreRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(require_role([RoleEnum.seeker, RoleEnum.recruiter])),
    db: AsyncSession = Depends(get_db)
):
    await check_rate_limit(f"ratelimit:ats:{user.id}", limit=50)
    
    try:
        resume_uuid = uuid.UUID(payload.resume_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid resume ID")

    # Fetch resume
    res = await db.execute(select(Resume).where(Resume.id == resume_uuid, Resume.user_id == user.id))
    resume = res.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Resolve JD text
    jd_text = payload.jd_text
    if payload.job_id:
        try:
            job_uuid = uuid.UUID(payload.job_id)
            job_res = await db.execute(select(Job).where(Job.id == job_uuid))
            job = job_res.scalar_one_or_none()
            if job and job.description_html:
                jd_text = re.sub(r'<[^>]+>', ' ', job.description_html)
            elif job and job.title:
                jd_text = job.title
        except ValueError:
            pass

    if not jd_text:
        raise HTTPException(status_code=422, detail="Must provide jd_text or a valid job_id with a description")

    # A. Deterministic Scoring
    jd_lower = jd_text.lower()
    jd_skills = []
    for skill in COMMON_SKILLS:
        if re.search(r'\b' + re.escape(skill) + r'\b', jd_lower):
            jd_skills.append(skill)
            
    parsed = resume.parsed or {}
    resume_skills = [s.lower() for s in parsed.get("skills", [])] + [s.lower() for s in parsed.get("suggested_keywords", [])]
    
    matched_keywords = [s for s in jd_skills if s in resume_skills]
    missing_keywords = [s for s in jd_skills if s not in resume_skills]
    
    if len(jd_skills) > 0:
        keywords_score = int((len(matched_keywords) / len(jd_skills)) * 100)
    else:
        keywords_score = 100 # No specific technical skills found in JD, assume ok
        
    # Heuristics for formatting and education (using parsed payload as a proxy for raw text)
    raw_text = json.dumps(parsed).lower()
    
    formatting_score = 50
    if "titles" in parsed and len(parsed.get("titles", [])) > 0: formatting_score += 20
    if "skills" in parsed and len(parsed.get("skills", [])) > 0: formatting_score += 20
    if 100 < len(raw_text) < 5000: formatting_score += 10
    formatting_score = min(100, formatting_score)
    
    education_score = 50
    if any(deg in raw_text for deg in ["bachelor", "master", "phd", "bsc", "msc", "b.s", "university", "college", "degree"]):
        education_score += 40
    education_score = min(100, education_score)

    # B. Provisional overall = deterministic score only. The Gemini-derived
    # "experience" section and final blended overall are filled in by the
    # background task below; ai_status tells the client whether to keep polling.
    deterministic_overall = (keywords_score + formatting_score + education_score) / 3.0
    overall = int(deterministic_overall)

    sections = {
        "keywords": keywords_score,
        "experience": 0,
        "education": education_score,
        "formatting": formatting_score
    }

    jd_snippet = jd_text[:150] + "..." if len(jd_text) > 150 else jd_text

    report_data = {
        "overall": overall,
        "sections": sections,
        "matched_keywords": matched_keywords,
        "missing_keywords": missing_keywords,
        "suggestions": [],
        "ai_feedback_available": False,
        "ai_status": "pending",
    }

    report = AtsReport(
        user_id=user.id,
        resume_id=resume.id,
        job_id=uuid.UUID(payload.job_id) if payload.job_id else None,
        jd_snippet=jd_snippet,
        report=report_data
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    background_tasks.add_task(
        _enrich_ats_report_with_gemini,
        report.id,
        resume.id,
        parsed,
        jd_text,
        keywords_score,
        formatting_score,
        education_score,
        missing_keywords,
    )

    return {
        "id": str(report.id),
        "resume_id": str(report.resume_id),
        "job_id": str(report.job_id) if report.job_id else None,
        "jd_snippet": report.jd_snippet,
        "overall": overall,
        "sections": sections,
        "matched_keywords": matched_keywords,
        "missing_keywords": missing_keywords,
        "suggestions": [],
        "ai_feedback_available": False,
        "ai_status": "pending",
        "created_at": report.created_at.isoformat()
    }

@router.get("/{id}")
async def get_ats_report(
    id: str,
    user: User = Depends(require_role([RoleEnum.seeker, RoleEnum.recruiter])),
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
        
    if report.user_id != user.id:
        raise HTTPException(status_code=404, detail="ATS Report not found")
        
    rdata = report.report
    return {
        "id": str(report.id),
        "resume_id": str(report.resume_id),
        "job_id": str(report.job_id) if report.job_id else None,
        "jd_snippet": report.jd_snippet,
        "overall": rdata.get("overall", 0),
        "sections": rdata.get("sections", {}),
        "matched_keywords": rdata.get("matched_keywords", []),
        "missing_keywords": rdata.get("missing_keywords", []),
        "suggestions": rdata.get("suggestions", []),
        "ai_feedback_available": rdata.get("ai_feedback_available", True),
        # Reports created before this field existed have already fully run.
        "ai_status": rdata.get("ai_status", "ready"),
        "created_at": report.created_at.isoformat()
    }
