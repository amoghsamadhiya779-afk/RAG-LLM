from upstash_redis import Redis
from fastapi import Request
import time
from .config import settings
from .errors import APIError
import httpx
import structlog

logger = structlog.get_logger(__name__)

try:
    redis = Redis(url=str(settings.UPSTASH_REDIS_REST_URL), token=settings.UPSTASH_REDIS_REST_TOKEN)
except Exception as e:
    logger.error("redis_init_failed", error=str(e))
    redis = None

async def verify_turnstile(token: str) -> bool:
    if not token:
        return False
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                settings.TURNSTILE_API_URL,
                data={
                    "secret": settings.TURNSTILE_SECRET_KEY,
                    "response": token
                },
                timeout=5.0
            )
            result = response.json()
            return result.get("success", False)
    except Exception as e:
        logger.warning("turnstile_verification_error", error=str(e))
        return False

async def check_rate_limit(key: str, limit: int, window: int = 86400):
    if not redis:
        return True # Fail open if redis is down
        
    current = redis.incr(key)
    if current == 1:
        redis.expire(key, window)
        
    if current > limit:
        logger.warning("rate_limit_exceeded", key=key, limit=limit)
        raise APIError("rate_limit_exceeded", f"Rate limit exceeded. Maximum {limit} requests allowed.", 429)
    return True

async def check_ai_budget(tokens: int = 1):
    if not redis:
        return True
    
    today = time.strftime("%Y-%m-%d")
    key = f"ai_budget:{today}"
    
    current = redis.incrby(key, tokens)
    if current == tokens:
        redis.expire(key, 86400)
        
    if current > settings.DAILY_AI_BUDGET:
        logger.error("ai_budget_exhausted", current=current, limit=settings.DAILY_AI_BUDGET)
        raise APIError("ai_budget_exhausted", "Daily AI budget exhausted.", 429)
    return True

async def check_guest_turnstile(request: Request):
    token = request.headers.get("X-Turnstile-Token")
    if not token:
        raise APIError("turnstile_required", "Turnstile verification required for guest access.", 401)
        
    valid = await verify_turnstile(token)
    if not valid:
        raise APIError("turnstile_invalid", "Invalid Turnstile token.", 401)

async def check_guest_limits(request: Request):
    if not redis:
        return True
        
    ip = request.client.host if request.client else "unknown"
    
    # 5/minute
    await check_rate_limit(f"guest:{ip}:min", 5, 60)
    # 20/hour
    await check_rate_limit(f"guest:{ip}:hr", 20, 3600)
    # 60/day
    await check_rate_limit(f"guest:{ip}:day", 60, 86400)
    return True

async def guest_ai_guard(request: Request):
    """Dependency to enforce limits and turnstile for guest AI usage."""
    await check_guest_turnstile(request)
    await check_guest_limits(request)
    return True
