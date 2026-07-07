from app.core.idempotency import IdempotentRoute
import uuid
import os
import re
import mimetypes
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.session import get_db, AsyncSessionLocal
from app.db.schemas import ResumeResponse, ParsedResume, PaginatedResponse
from app.db.resume_repo import ResumeRepository
from app.core.deps import require_user, require_role
from app.db.models import User, RoleEnum
from app.services.rag.parser import parse_resume_file
from app.core.config import settings

router = APIRouter(route_class=IdempotentRoute, prefix="/resumes", tags=["resumes"])

MAX_FILE_SIZE = 5 * 1024 * 1024 # 5 MB
ALLOWED_MIMES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
}

def sanitize_filename(filename: str) -> str:
    base = os.path.basename(filename)
    return re.sub(r'[^a-zA-Z0-9_\.-]', '_', base)

async def scan_for_malware(file_bytes: bytes) -> bool:
    # Mock ClamAV scan. In production, this would stream to a ClamAV daemon.
    # Return False if malware detected.
    if b"X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*" in file_bytes:
        return False
    return True

async def store_encrypted_object(user_id: uuid.UUID, file_bytes: bytes) -> str:
    # Mock encrypted object storage
    # In production, encrypt with KMS key and push to S3 or secure bucket
    random_key = f"{user_id}/{uuid.uuid4().hex}"
    # Simulated upload...
    return random_key

async def process_resume_bg(resume_id: uuid.UUID, file_bytes: bytes, filename: str):
    # Parse and embed the resume (Stage 2 & 3 happens here in production)
    result = await parse_resume_file(file_bytes, filename)
    async with AsyncSessionLocal() as db:
        repo = ResumeRepository(db)
        await repo.update_parsed(resume_id, result["parsed"], result["embedding"])

from pydantic import BaseModel

class ResumeUploadRequest(BaseModel):
    filename: str
    storage_path: str

async def download_from_supabase(storage_path: str) -> bytes:
    import httpx
    url = f"{settings.SUPABASE_URL}/storage/v1/object/resumes/{storage_path}"
    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        return response.content

@router.post("")
async def upload_resume(
    payload: ResumeUploadRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(require_role([RoleEnum.seeker, RoleEnum.recruiter])),
    db: AsyncSession = Depends(get_db)
):
    # 1. Enforce IDOR check
    if not payload.storage_path.startswith(f"{user.id}/"):
        raise HTTPException(status_code=403, detail="Invalid storage path ownership")
        
    # 2. Download from Supabase
    try:
        file_bytes = await download_from_supabase(payload.storage_path)
    except Exception as e:
        raise HTTPException(status_code=502, detail="Upstream storage error: Could not download file from Supabase")

    # 3. Check size
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 5MB.")
    
    # 4. Magic byte sniff (PDF or DOCX)
    is_pdf = file_bytes.startswith(b"%PDF")
    is_docx = file_bytes.startswith(b"PK\x03\x04")
    # Also allow simple txt if it's utf-8 decodable and doesn't contain null bytes
    is_txt = False
    if not (is_pdf or is_docx):
        try:
            file_bytes.decode('utf-8')
            if b"\x00" not in file_bytes:
                is_txt = True
        except UnicodeDecodeError:
            pass
            
    if not (is_pdf or is_docx or is_txt):
        raise HTTPException(status_code=415, detail="Unsupported file type. Allowed: PDF, DOCX, TXT.")
        
    # 5. Sanitize filename
    safe_filename = sanitize_filename(payload.filename or "unknown.pdf")
    
    # 6. Malware scan
    is_safe = await scan_for_malware(file_bytes)
    if not is_safe:
        raise HTTPException(status_code=400, detail="Malware detected. Upload rejected.")
    
    repo = ResumeRepository(db)
    resume = await repo.create(user.id, safe_filename, payload.storage_path, len(file_bytes))
    
    # Process synchronously to avoid race conditions with frontend
    await process_resume_bg(resume.id, file_bytes, safe_filename)
    
    # Update size and storage_path in DB
    resume = await repo.get_by_id(resume.id)
    resume.size_bytes = len(file_bytes)
    resume.storage_path = payload.storage_path
    await db.commit()
    await db.refresh(resume)
    
    return {
        "id": str(resume.id),
        "filename": resume.file_name,
        "storage_path": resume.storage_path,
        "size_bytes": resume.size_bytes,
        "created_at": resume.uploaded_at.isoformat() if resume.uploaded_at else None
    }

@router.get("/mine", response_model=PaginatedResponse[ResumeResponse])
async def get_my_resumes(
    user: User = Depends(require_role([RoleEnum.seeker, RoleEnum.recruiter])),
    db: AsyncSession = Depends(get_db)
):
    repo = ResumeRepository(db)
    resumes = await repo.get_mine(user.id)
    return {"items": resumes, "total": len(resumes), "page": 1, "page_size": max(1, len(resumes))}

@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: uuid.UUID,
    user: User = Depends(require_role([RoleEnum.seeker, RoleEnum.recruiter])),
    db: AsyncSession = Depends(get_db)
):
    repo = ResumeRepository(db)
    resume = await repo.get_by_id(resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    # Basic authorization: seekers can only view their own resumes
    if user.profile.role == RoleEnum.seeker and resume.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return ResumeResponse.model_validate(resume)

@router.get("/{resume_id}/analysis", response_model=dict)
async def get_resume_analysis(
    resume_id: uuid.UUID,
    user: User = Depends(require_role([RoleEnum.seeker, RoleEnum.recruiter])),
    db: AsyncSession = Depends(get_db)
):
    repo = ResumeRepository(db)
    resume = await repo.get_by_id(resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if user.profile.role == RoleEnum.seeker and resume.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if not resume.parsed:
        # Mock analysis if parsing is not complete
        return {
            "status": "pending",
            "extracted_skills": [],
            "seniority_estimate": "Unknown",
            "suggestions": [],
            "strengths": [],
            "gaps": [],
            "summary": "Analysis in progress...",
            "id": str(resume_id),
            "resume_id": str(resume_id)
        }
    
    # Map parsed schema to what the frontend expects
    return {
        "status": "completed",
        "extracted_skills": resume.parsed.get("skills") or [],
        "seniority_estimate": resume.parsed.get("seniority") or "Unknown",
        "suggestions": resume.parsed.get("suggested_keywords") or [],
        "strengths": [],
        "gaps": [],
        "summary": f"Identified {len(resume.parsed.get('skills') or [])} core skills and estimated seniority as {resume.parsed.get('seniority') or 'Unknown'}.",
        "id": str(resume.id),
        "resume_id": str(resume.id)
    }

@router.post("/{resume_id}/parse", response_model=ParsedResume)
async def parse_resume(
    resume_id: uuid.UUID,
    user: User = Depends(require_role([RoleEnum.seeker])),
    db: AsyncSession = Depends(get_db)
):
    repo = ResumeRepository(db)
    resume = await repo.get_by_id(resume_id)
    if not resume or resume.user_id != user.id:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    if not resume.parsed:
        raise HTTPException(status_code=400, detail="Resume not parsed yet")
        
    return ParsedResume(**resume.parsed)

@router.get("/{resume_id}/keywords", response_model=dict)
async def get_resume_keywords(
    resume_id: uuid.UUID,
    user: User = Depends(require_role([RoleEnum.seeker])),
    db: AsyncSession = Depends(get_db)
):
    repo = ResumeRepository(db)
    resume = await repo.get_by_id(resume_id)
    if not resume or resume.user_id != user.id:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    if not resume.parsed:
        raise HTTPException(status_code=400, detail="Resume not parsed yet")
        
    keywords = resume.parsed.get("suggested_keywords", [])
    return {"suggested_keywords": keywords}

from pydantic import BaseModel, Field
import httpx
import os
import json

class AtsScoreRequest(BaseModel):
    resume_id: uuid.UUID
    job_text: str = Field(..., description="The raw text or description of the job to compare against.")

class AtsScoreReport(BaseModel):
    match_percentage: int
    keyword_coverage: List[str]
    missing_skills: List[str]
    flags: List[str]
    suggestions: List[str]

@router.post("/ats/score", response_model=AtsScoreReport)
async def score_ats(
    request: AtsScoreRequest,
    user: User = Depends(require_role([RoleEnum.seeker, RoleEnum.recruiter])),
    db: AsyncSession = Depends(get_db)
):
    """
    Stage 6: ATS Scoring via Hugging Face Proxy.
    Calls our secure HF endpoint with an HF_TOKEN. 
    The HF endpoint holds the GEMINI_API_KEY as a Space Secret.
    """
    repo = ResumeRepository(db)
    resume = await repo.get_by_id(request.resume_id)
    if not resume or resume.user_id != user.id:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    resume_text = resume.parsed if resume.parsed else "No resume data"
    
    api_key = settings.GEMINI_API_KEY # local fallback if no HF space
    
    report_data = {
        "match_percentage": 0,
        "keyword_coverage": [],
        "missing_skills": [],
        "flags": ["Could not connect to ATS scoring engine"],
        "suggestions": []
    }
    
    if api_key:
        # Call Gemini using official SDK
        try:
            from google.genai import types
            from app.core.gemini_client import get_gemini_client
            
            model = settings.GEMINI_MODEL
            genai_client = get_gemini_client()
            
            config = types.GenerateContentConfig(
                system_instruction="You are an ATS (Applicant Tracking System). Compare the resume against the job text. Output a strict JSON object: {\"match_percentage\": 85, \"keyword_coverage\": [\"React\"], \"missing_skills\": [\"Go\"], \"flags\": [\"Missing degree\"], \"suggestions\": [\"Add more metrics\"]}",
                response_mime_type="application/json"
            )
            
            resp = await genai_client.aio.models.generate_content(
                model=model,
                contents=f"--- RESUME ---\n{resume_text}\n--- JOB ---\n{request.job_text}",
                config=config
            )
            content_text = resp.text
            if content_text:
                parsed_json = json.loads(content_text)
                # Validate
                report_data = AtsScoreReport(**parsed_json).model_dump()
        except Exception:
            pass # fallback to error report
            
    return AtsScoreReport(**report_data)

@router.delete("/{resume_id}")
async def hard_delete_resume(
    resume_id: uuid.UUID,
    user: User = Depends(require_role([RoleEnum.seeker, RoleEnum.admin])),
    db: AsyncSession = Depends(get_db)
):
    """
    PII hard-delete endpoint. Completely purges the resume and parsed data.
    """
    repo = ResumeRepository(db)
    resume = await repo.get_by_id(resume_id)
    if not resume or (resume.user_id != user.id and user.role != RoleEnum.admin):
        raise HTTPException(status_code=404, detail="Resume not found")
        
    await repo.delete(resume_id)
    # Note: In production, trigger object storage deletion here.
    return {"status": "deleted"}
