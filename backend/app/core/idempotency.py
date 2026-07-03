import json
import uuid
from typing import Callable
from fastapi import Request, Response
from fastapi.routing import APIRoute
from fastapi.responses import JSONResponse
from app.core.limits import redis
import structlog
import jwt

logger = structlog.get_logger(__name__)

class IdempotentRoute(APIRoute):
    def get_route_handler(self) -> Callable:
        original_route_handler = super().get_route_handler()

        async def custom_route_handler(request: Request) -> Response:
            if request.method not in ["POST", "PUT", "PATCH", "DELETE"]:
                return await original_route_handler(request)

            idempotency_key = request.headers.get("Idempotency-Key")
            if not idempotency_key:
                return await original_route_handler(request)

            if not redis:
                return await original_route_handler(request)

            user_id = "anonymous"
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                try:
                    token = auth_header.split(" ")[1]
                    payload = jwt.decode(token, options={"verify_signature": False})
                    user_id = payload.get("sub", "anonymous")
                except Exception:
                    pass

            redis_key = f"idemp:{user_id}:{request.method}:{request.url.path}:{idempotency_key}"

            cached = redis.get(redis_key)
            if cached:
                try:
                    data = json.loads(cached)
                    logger.info("idempotency_hit", key=idempotency_key)
                    return JSONResponse(
                        status_code=data.get("status_code", 200),
                        content=data.get("body"),
                        headers={"Idempotency-Replayed": "true"}
                    )
                except Exception as e:
                    logger.error("idempotency_parse_error", error=str(e))

            # Proceed normally
            response: Response = await original_route_handler(request)

            # Cache the response if it's JSON
            if isinstance(response, JSONResponse) and response.status_code >= 200 and response.status_code < 300:
                try:
                    body = json.loads(response.body.decode("utf-8"))
                    cache_data = {
                        "status_code": response.status_code,
                        "body": body
                    }
                    redis.setex(redis_key, 172800, json.dumps(cache_data)) # 48 hours
                except Exception as e:
                    logger.error("idempotency_cache_error", error=str(e))

            return response

        return custom_route_handler
