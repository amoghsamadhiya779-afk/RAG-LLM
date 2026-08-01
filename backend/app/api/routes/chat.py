from app.core.idempotency import IdempotentRoute
import os
import json
import asyncio
import httpx
import structlog
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.config import settings
from app.db.models import User
from app.core.deps import optional_user
from app.core.limits import check_rate_limit, check_guest_turnstile

logger = structlog.get_logger(__name__)

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

        augmented_prompt = await _build_augmented_prompt(db, payload.message)

        model = settings.GEMINI_MODEL
        genai_client = get_gemini_client()

        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
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


SYSTEM_INSTRUCTION = (
    "You are the jOBiON Career Assistant. You help users find jobs, give career "
    "advice, and summarize their skills. Be concise, professional, and "
    "encouraging. Cite the provided jobs and web context when relevant. Do NOT "
    "fabricate jobs."
)


async def _build_augmented_prompt(db: AsyncSession, message: str) -> str:
    """Runs job-vector retrieval and web search concurrently (they're
    independent) and folds both into the RAG prompt."""
    from app.services.embeddings import embed_text
    from app.db.repositories.jobs_repo import JobsRepository
    from app.services.serper import search_web

    async def _job_context() -> str:
        message_embedding = await embed_text(message)
        jobs_repo = JobsRepository(db)
        matched_jobs = await jobs_repo.search_by_vector(message_embedding, k=5)
        return "\n".join(
            f"- {j.title} at {j.company or 'Unknown'}: {j.description_html[:200]}..."
            for j in matched_jobs
        )

    async def _web_context() -> str:
        web_results = await search_web(message, limit=3)
        return "\n".join(f"- {w['title']}: {w['snippet']} ({w['link']})" for w in web_results)

    job_context, web_context = await asyncio.gather(_job_context(), _web_context())

    return f"""
User Message: {message}

--- Context (Top Matched Jobs) ---
{job_context if job_context else 'No jobs found.'}

--- Web Context ---
{web_context if web_context else 'No web context available.'}
"""


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@router.post("/stream")
async def chat_with_gemini_stream(
    request: Request,
    payload: ChatRequest,
    user: User = Depends(optional_user),
    db: AsyncSession = Depends(get_db)
):
    """Same RAG pipeline as POST /chat, but streams tokens as they're
    generated (SSE) instead of waiting for the full completion."""
    if not user:
        await check_guest_turnstile(request)
        client_ip = request.client.host
        await check_rate_limit(f"ratelimit:chat:{client_ip}", limit=20)
    else:
        await check_rate_limit(f"ratelimit:chat:{user.id}", limit=100)

    api_key = settings.GEMINI_API_KEY

    async def event_stream():
        if not api_key:
            yield _sse("error", {"message": "Gemini API Key is missing on the server."})
            return
        try:
            from google.genai import types
            from app.core.gemini_client import get_gemini_client

            augmented_prompt = await _build_augmented_prompt(db, payload.message)

            model = settings.GEMINI_MODEL
            genai_client = get_gemini_client()
            config = types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.7
            )

            stream = await genai_client.aio.models.generate_content_stream(
                model=model,
                contents=augmented_prompt,
                config=config
            )
            async for chunk in stream:
                if chunk.text:
                    yield _sse("token", {"text": chunk.text})
            yield _sse("done", {})
        except Exception as e:
            logger.warning("chat_stream_failed", error=str(e))
            yield _sse("error", {"message": f"Failed to generate response: {e}"})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

