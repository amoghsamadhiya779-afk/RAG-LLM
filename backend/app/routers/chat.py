import os
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.config import settings

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

@router.post("", response_model=ChatResponse)
async def chat_with_gemini(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        # Fallback if no API key is provided
        return ChatResponse(response="Gemini API Key is missing on the server. Please configure it in .env.")
        
    try:
        from google import genai
        from google.genai import types
        
        model = settings.GEMINI_MODEL or "gemini-2.5-flash"
        genai_client = genai.Client(api_key=api_key)
        
        config = types.GenerateContentConfig(
            system_instruction="You are the jOBiON Career Assistant. You help users find jobs, give career advice, and summarize their skills. Be concise, professional, and encouraging.",
            temperature=0.7
        )
        
        resp = await genai_client.aio.models.generate_content(
            model=model,
            contents=request.message,
            config=config
        )
        text = resp.text or ""
        return ChatResponse(response=text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {e}")
