import os
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

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
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        # Fallback if no API key is provided
        return ChatResponse(response="Gemini API Key is missing on the server. Please configure it in .env.")
        
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}",
                headers={"Content-Type": "application/json"},
                json={
                    "systemInstruction": {
                        "parts": [{"text": "You are the jOBiON Career Assistant. You help users find jobs, give career advice, and summarize their skills. Be concise, professional, and encouraging."}]
                    },
                    "contents": [{"parts": [{"text": request.message}]}],
                    "generationConfig": {
                        "temperature": 0.7
                    }
                },
                timeout=15.0
            )
            
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return ChatResponse(response=text)
            else:
                raise HTTPException(status_code=500, detail="Gemini API Error")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {e}")
