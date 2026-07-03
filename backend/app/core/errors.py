from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import structlog
from typing import Any

logger = structlog.get_logger(__name__)

class APIError(Exception):
    def __init__(self, code: str, message: str, status_code: int = status.HTTP_400_BAD_REQUEST, details: Any = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details

async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = getattr(request.state, "request_id", "unknown")
    logger.error("unhandled_exception", exc_info=exc, request_id=request_id, path=request.url.path)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "internal_error",
                "message": "An unexpected error occurred.",
                "request_id": request_id
            }
        }
    )

async def api_error_handler(request: Request, exc: APIError) -> JSONResponse:
    request_id = getattr(request.state, "request_id", "unknown")
    logger.warning("api_error", code=exc.code, message=exc.message, request_id=request_id, path=request.url.path)
    
    payload = {
        "error": {
            "code": exc.code,
            "message": exc.message,
            "request_id": request_id
        }
    }
    if exc.details:
        payload["error"]["details"] = exc.details
        
    return JSONResponse(
        status_code=exc.status_code,
        content=payload
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    request_id = getattr(request.state, "request_id", "unknown")
    logger.warning("validation_error", errors=exc.errors(), request_id=request_id, path=request.url.path)
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "validation_error",
                "message": "Invalid request parameters.",
                "details": exc.errors(),
                "request_id": request_id
            }
        }
    )

def setup_exception_handlers(app):
    app.add_exception_handler(Exception, global_exception_handler)
    app.add_exception_handler(APIError, api_error_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
