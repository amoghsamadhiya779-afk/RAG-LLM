import hashlib
import json
import structlog
from typing import List
from app.core.config import settings
from app.core.errors import APIError
from app.core.gemini_client import get_gemini_client
from app.core.limits import check_ai_budget, redis

logger = structlog.get_logger(__name__)

EMBEDDING_CACHE_TTL = 7 * 86400  # 7 days - embeddings are deterministic for a given (text, model, dims)


def _embedding_cache_key(text: str) -> str:
    digest = hashlib.sha256(
        f"{settings.GEMINI_EMBED_MODEL}:{settings.GEMINI_EMBED_DIMS}:{text}".encode("utf-8")
    ).hexdigest()
    return f"embed_cache:{digest}"


async def embed_text(text: str) -> List[float]:
    """Generates an embedding for the given text using the configured model.
    Identical text is cached in Redis to skip repeat Gemini calls/spend."""
    if not text or not text.strip():
        return [0.0] * 768

    cache_key = _embedding_cache_key(text)
    if redis:
        try:
            cached = await redis.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception as e:
            logger.warning("embedding_cache_read_failed", error=str(e))

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
    except Exception as e:
        logger.error("embedding_failed", error=str(e))
        raise APIError("gemini_error", f"Failed to generate embedding: {e}", 500)

    if redis:
        try:
            await redis.setex(cache_key, EMBEDDING_CACHE_TTL, json.dumps(embedding))
        except Exception as e:
            logger.warning("embedding_cache_write_failed", error=str(e))

    return embedding
