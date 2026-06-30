from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Dict, Any
import uuid
import os
import httpx
import json

from app.db.session import get_db
from app.models.models import Job, JobStatusEnum, Resume
from app.repositories.resume_repo import ResumeRepository

router = APIRouter(prefix="/insights", tags=["insights"])

@router.get("/skill-gap")
async def get_skill_gap(
    resumeId: uuid.UUID = Query(..., description="The ID of the user's uploaded resume"),
    db: AsyncSession = Depends(get_db)
):
    # 1. Fetch Resume
    repo = ResumeRepository(db)
    resume = await repo.get_by_id(resumeId)
    if not resume or not resume.parsed:
        raise HTTPException(status_code=404, detail="Resume not found or not fully parsed")
        
    # 2. Fetch some top live jobs as a target sample
    stmt = select(Job).where(Job.status == JobStatusEnum.live).limit(10)
    result = await db.execute(stmt)
    jobs = list(result.scalars().all())
    
    if not jobs:
        return []
        
    # 3. Analyze with Gemini
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API Key missing")
        
    jobs_context = "\n\n".join([
        f"Title: {j.title}\nTags: {', '.join(j.tags or [])}\nRequirements: {', '.join(j.requirements or [])}" 
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
                        "parts": [{"text": "You are an expert Career Coach and AI Analyzer. You are provided with a user's parsed resume and a sample of live tech jobs. Identify 2 key technical skills the user lacks compared to these job requirements, but would have a high impact on their employability. Output a strict JSON array of objects. Format: [{\"skill\": \"Skill Name\", \"impact\": \"High Impact\", \"progress\": 20, \"description\": \"Short description of why it's needed\"}]"}]
                    },
                    "contents": [{"parts": [{"text": f"--- PARSED RESUME ---\n{resume_context}\n\n--- SAMPLE JOBS ---\n{jobs_context}"}]}],
                    "generationConfig": {"responseMimeType": "application/json"}
                },
                timeout=20.0
            )
            
            if resp.status_code == 200:
                content_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                skills = json.loads(content_text)
                return skills
            else:
                raise HTTPException(status_code=500, detail="Failed to analyze skill gap")
    except Exception as e:
        print(f"Skill gap analysis failed: {e}")
        raise HTTPException(status_code=500, detail="Internal AI error")
