from google import genai
from typing import List
from app.core.config import settings
from app.core.errors import APIError
from app.core.limits import check_ai_budget
import structlog

logger = structlog.get_logger(__name__)

try:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
except Exception as e:
    logger.error("gemini_init_failed", error=str(e))
    client = None

async def generate_embedding(text: str) -> List[float]:
    if not client:
        raise APIError("gemini_unavailable", "AI service is currently unavailable.", 503)
        
    await check_ai_budget(1)
    
    try:
        response = await client.aio.models.embed_content(
            model='text-embedding-004',
            contents=text
        )
        return response.embeddings[0].values
    except Exception as e:
        logger.error("embedding_failed", error=str(e))
        raise APIError("gemini_error", f"Failed to generate embedding: {e}", 500)
