import sys
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, jobs, companies, applications, resumes, admin, chat, insights
from app.core.config import settings

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup check
    is_pytest = "pytest" in sys.modules
    is_testing = os.environ.get("TESTING") in ("1", "true", "True")
    
    if not (is_pytest or is_testing):
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
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
                raise ValueError(
                    f"Configured GEMINI_MODEL '{model_name}' was not found in available models: {model_names}"
                )
            logger.info(f"Gemini startup check passed. Model '{model_name}' is available.")
        except Exception as e:
            logger.error(f"Gemini startup verification failed: {e}")
            raise ValueError(f"Gemini configuration or verification failed: {e}") from e
            
    yield

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

@app.get("/ready")
async def ready():
    # In production, verify DB and Redis connections here
    return {"status": "ready"}

@app.get("/health/gemini")
async def health_gemini():
    api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
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
