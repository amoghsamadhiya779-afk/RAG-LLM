from app.core.idempotency import IdempotentRoute
import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.config import settings
from app.db.models import User
from app.core.deps import optional_user
from app.core.limits import check_rate_limit, check_guest_turnstile

router = APIRouter(route_class=IdempotentRoute, prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

@router.get("")
async def get_chat_history():
    return []

@router.post("", response_model=ChatResponse)
async def chat_with_gemini(
    request: Request,
    payload: ChatRequest,
    user: User = Depends(optional_user),
    db: AsyncSession = Depends(get_db)
):
    if not user:
        await check_guest_turnstile(request)
        client_ip = request.client.host
        await check_rate_limit(f"ratelimit:chat:{client_ip}", limit=20)
    else:
        await check_rate_limit(f"ratelimit:chat:{user.id}", limit=100)

    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return ChatResponse(response="Gemini API Key is missing on the server. Please configure it in .env.")
        
    try:
        from google.genai import types
        from app.core.gemini_client import get_gemini_client
        from app.services.embeddings import embed_text
        from app.db.repositories.jobs_repo import JobsRepository
        from app.services.serper import search_web
        
        # 1. Embed user message
        message_embedding = await embed_text(payload.message)
        
        # 2. Retrieve top-k relevant jobs
        jobs_repo = JobsRepository(db)
        matched_jobs = await jobs_repo.search_by_vector(message_embedding, k=5)
        
        job_context = "\n".join([f"- {j.title} at {j.company or 'Unknown'}: {j.description_html[:200]}..." for j in matched_jobs])
        
        # 3. Retrieve Serper web context
        web_results = await search_web(payload.message, limit=3)
        web_context = "\n".join([f"- {w['title']}: {w['snippet']} ({w['link']})" for w in web_results])

        # 4. Construct Prompt
        augmented_prompt = f"""
User Message: {payload.message}

--- Context (Top Matched Jobs) ---
{job_context if job_context else 'No jobs found.'}

--- Web Context ---
{web_context if web_context else 'No web context available.'}
"""
        
        model = settings.GEMINI_MODEL
        genai_client = get_gemini_client()
        
        config = types.GenerateContentConfig(
            system_instruction="You are the jOBiON Career Assistant. You help users find jobs, give career advice, and summarize their skills. Be concise, professional, and encouraging. Cite the provided jobs and web context when relevant. Do NOT fabricate jobs.",
            temperature=0.7
        )
        
        resp = await genai_client.aio.models.generate_content(
            model=model,
            contents=augmented_prompt,
            config=config
        )
        text = resp.text or ""
        return ChatResponse(response=text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {e}")

