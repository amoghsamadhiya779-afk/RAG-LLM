import sys
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, jobs, companies, applications, resumes, admin, chat, insights
from app.core.config import settings

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup check
    is_pytest = "pytest" in sys.modules
    is_testing = settings.TESTING
    
    if not (is_pytest or is_testing):
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not configured but required for startup.")
        
        model_name = settings.GEMINI_MODEL
        try:
            from app.core.gemini_client import get_gemini_client
            client = get_gemini_client()
            models_list = await client.aio.models.list()
            model_names = [m.name for m in models_list]
            
            found = False
            for name in model_names:
                if model_name in name or name.split("/")[-1] == model_name:
                    found = True
                    break
            
            if not found:
                logger.error(f"Configured GEMINI_MODEL '{model_name}' was not found in available models: {model_names}")
                sys.exit(1)
            logger.info(f"Gemini startup check passed. Model '{model_name}' is available.")
        except Exception as e:
            logger.error(f"Gemini configuration or verification failed: {e}")
            sys.exit(1)
            
    yield

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip().rstrip("/") for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(companies.router)
app.include_router(applications.router)
app.include_router(resumes.router)
app.include_router(admin.router)
app.include_router(chat.router)
app.include_router(insights.router)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/health/deep")
async def health_deep(
    request: Request,
    api_key: str = Header(..., alias="X-API-Key")
):
    if api_key != settings.backend_api_key:
        raise HTTPException(status_code=401, detail="Invalid API Key")
        
    from scripts.check_connections import run_checks
    
    # We can capture stdout or modify run_checks to return dict. 
    # Let's modify check_connections.py later to return dict.
    from scripts.check_connections import (
        check_database, check_supabase_auth, check_jwks, check_gemini,
        check_adzuna, check_upstash, check_resend, check_turnstile
    )
    
    results = {
        "database": await check_database(),
        "supabase_auth": await check_supabase_auth(),
        "supabase_jwks": await check_jwks(),
        "gemini": await check_gemini(),
        "adzuna": await check_adzuna(),
        "redis": await check_upstash(),
        "resend": await check_resend(),
        "turnstile": await check_turnstile(),
    }
    
    has_critical_failure = any(res[0] == "FAIL" for res in results.values())
    status_code = 503 if has_critical_failure else 200
    
    return JSONResponse(status_code=status_code, content={"status": "fail" if has_critical_failure else "ok", "results": results})

@app.get("/ready")
async def ready():
    # In production, verify DB and Redis connections here
    return {"status": "ready"}

@app.get("/health/gemini")
async def health_gemini():
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API Key is not configured")
        
    model_name = settings.GEMINI_MODEL
    try:
        from app.core.gemini_client import get_gemini_client
        client = get_gemini_client()
        models_list = await client.aio.models.list()
        model_names = [m.name for m in models_list]
        found = False
        for name in model_names:
            if model_name in name or name.split("/")[-1] == model_name:
                found = True
                break
        if not found:
            raise ValueError(
                f"Configured GEMINI_MODEL '{model_name}' was not found in available models: {model_names}"
            )
        return {"status": "healthy", "model": model_name}
    except Exception as e:
        logger.error(f"Gemini health check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Gemini health check failed: {e}")
