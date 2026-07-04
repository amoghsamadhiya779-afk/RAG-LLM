import structlog
from typing import List
from app.core.config import settings
from app.core.errors import APIError
from app.core.gemini_client import get_gemini_client
from app.core.limits import check_ai_budget

logger = structlog.get_logger(__name__)

async def embed_text(text: str) -> List[float]:
    """Generates an embedding for the given text using text-embedding-004."""
    if not text or not text.strip():
        return [0.0] * 768
        
    client = get_gemini_client()
    if not client:
        raise APIError("gemini_unavailable", "AI service is currently unavailable.", 503)
        
    await check_ai_budget(1)
    
    try:
        response = await client.aio.models.embed_content(
            model=settings.GEMINI_EMBED_MODEL,
            contents=text,
            config={'output_dimensionality': settings.GEMINI_EMBED_DIMS}
        )
        embedding = response.embeddings[0].values
        assert len(embedding) == settings.GEMINI_EMBED_DIMS, f"Embedding length {len(embedding)} is not {settings.GEMINI_EMBED_DIMS}"
        return embedding
    except Exception as e:
        logger.error("embedding_failed", error=str(e))
        raise APIError("gemini_error", f"Failed to generate embedding: {e}", 500)
