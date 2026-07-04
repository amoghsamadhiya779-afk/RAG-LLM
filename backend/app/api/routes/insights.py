from app.core.idempotency import IdempotentRoute
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
from app.db.models import Job, JobStatusEnum, Resume
from app.db.resume_repo import ResumeRepository
from app.core.config import settings

router = APIRouter(route_class=IdempotentRoute, prefix="/insights", tags=["insights"])

@router.get("/skill-gap")
async def get_skill_gap(
    resumeId: uuid.UUID = Query(..., description="The ID of the user's uploaded resume"),
    db: AsyncSession = Depends(get_db)
):
    # Fetch user's resume
    resume_repo = ResumeRepository(db)
    resume = await resume_repo.get_by_id(resumeId)
    
    if not resume or not resume.parsed:
        return {"error": "Resume not found or not parsed yet. Please upload a resume first."}
        
    api_key = settings.GEMINI_API_KEY
        
    # 2. Fetch some top live jobs as a target sample
    stmt = select(Job).where(Job.status == JobStatusEnum.live).limit(10)
    result = await db.execute(stmt)
    jobs = list(result.scalars().all())
    
    if not jobs:
        return []
        
    # 3. Analyze with Gemini
    if not api_key:
        print("Warning: GEMINI_API_KEY is missing. Returning mock skill gap data.")
        return [
            {"skill": "React", "impact": "High Impact", "progress": 30, "description": "Highly requested in current tech jobs."},
            {"skill": "Python", "impact": "Medium Impact", "progress": 50, "description": "Useful for data and backend roles."}
        ]
        
    jobs_context = "\n\n".join([
        f"Title: {j.title}\nTags: {', '.join(j.tags or [])}\nRequirements: {', '.join(j.requirements or [])}" 
        for j in jobs
    ])
    
    resume_context = json.dumps(resume.parsed)
    
    try:
        from google.genai import types
        from app.core.gemini_client import get_gemini_client
        
        model = settings.GEMINI_MODEL
        genai_client = get_gemini_client()
        
        config = types.GenerateContentConfig(
            system_instruction="You are an expert Career Coach and AI Analyzer. You are provided with a user's parsed resume and a sample of live tech jobs. Identify 2 key technical skills the user lacks compared to these job requirements, but would have a high impact on their employability. Output a strict JSON array of objects. Format: [{\"skill\": \"Skill Name\", \"impact\": \"High Impact\", \"progress\": 20, \"description\": \"Short description of why it's needed\"}]",
            response_mime_type="application/json"
        )
        
        resp = await genai_client.aio.models.generate_content(
            model=model,
            contents=f"--- PARSED RESUME ---\n{resume_context}\n\n--- SAMPLE JOBS ---\n{jobs_context}",
            config=config
        )
        content_text = resp.text
        if content_text:
            skills = json.loads(content_text)
            return skills
        else:
            print("Warning: Gemini returned empty content. Returning mock skill gap data.")
            return [
                {"skill": "React", "impact": "High Impact", "progress": 30, "description": "Highly requested in current tech jobs."},
                {"skill": "Python", "impact": "Medium Impact", "progress": 50, "description": "Useful for data and backend roles."}
            ]
    except Exception as e:
        print(f"Skill gap analysis failed: {e}")
        return [
            {"skill": "React", "impact": "High Impact", "progress": 30, "description": "Highly requested in current tech jobs."},
            {"skill": "Python", "impact": "Medium Impact", "progress": 50, "description": "Useful for data and backend roles."}
        ]
