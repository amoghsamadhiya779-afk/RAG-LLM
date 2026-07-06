from google import genai
from google.genai import types
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from pydantic import BaseModel, Field
from typing import List, Optional
from app.core.config import settings
from app.core.errors import APIError
from app.core.limits import check_ai_budget
import structlog
import httpx

logger = structlog.get_logger(__name__)

# Initialize client using the new SDK
try:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
except Exception as e:
    logger.error("gemini_init_failed", error=str(e))
    client = None

class ParsedResume(BaseModel):
    skills: List[str] = Field(default_factory=list)
    experience_years: Optional[int] = None
    summary: Optional[str] = None
    job_titles: List[str] = Field(default_factory=list)

class ATSScore(BaseModel):
    score: int
    matched_keywords: List[str]
    missing_keywords: List[str]
    suggestions: List[str]

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((httpx.ReadTimeout, httpx.ConnectError))
)
async def analyze_resume_gemini(text: str) -> ParsedResume:
    if not client:
        raise APIError("gemini_unavailable", "AI service is currently unavailable.", 503)
        
    await check_ai_budget(1)
    
    prompt = f"Analyze this resume and extract the skills, total years of experience, a brief summary, and previous job titles:\n\n{text}"
    
    try:
        response = await client.aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ParsedResume,
                temperature=0.1
            ),
        )
        return response.parsed
    except Exception as e:
        logger.error("gemini_call_failed", error=str(e))
        raise APIError("gemini_error", f"Failed to analyze resume: {e}", 500)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((httpx.ReadTimeout, httpx.ConnectError))
)
async def get_ats_score(resume_text: str, job_description: str) -> ATSScore:
    if not client:
        raise APIError("gemini_unavailable", "AI service is currently unavailable.", 503)
        
    await check_ai_budget(1)
    
    prompt = f"""
    Evaluate the following resume against the job description.
    Provide an overall ATS score (0-100), and breakdown scores (0-100) for:
    - keywords (how well skills match)
    - experience (does the candidate have the required years and level of responsibility)
    - education (does the candidate meet degree requirements)
    - formatting (is the resume structured cleanly)
    
    Also provide a list of matched keywords, missing keywords, and 3-5 specific suggestions for improvement.
    
    Job Description:
    {job_description}
    
    Resume:
    {resume_text}
    """
    
    try:
        response = await client.aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ATSScore,
                temperature=0.1
            ),
        )
        return response.parsed
    except Exception as e:
        logger.error("gemini_call_failed", error=str(e))
        raise APIError("gemini_error", f"Failed to compute ATS score: {e}", 500)
