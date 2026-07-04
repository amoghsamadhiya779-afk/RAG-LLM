import sys
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, jobs, companies, applications, resumes, admin, chat, insights, internal_ingest
from app.core.config import settings

logger = logging.getLogger(__name__)

# Optional Sentry initialization
try:
    import sentry_sdk
    if settings.SENTRY_DSN:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            traces_sample_rate=1.0,
            profiles_sample_rate=1.0,
        )
        logger.info("Sentry SDK initialized successfully.")
    else:
        logger.info("SENTRY_DSN not provided; Sentry disabled.")
except ImportError:
    logger.info("sentry_sdk not installed; Sentry disabled.")

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
            else:
                logger.info(f"Gemini startup check passed. Model '{model_name}' is available.")
        except Exception as e:
            logger.warning(f"Gemini configuration or verification failed (API may be down or key invalid): {e}. Continuing boot.")
            
    yield

from app.core.errors import APIError

async def api_error_handler(request: Request, exc: APIError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "code": exc.code},
    )

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)
app.add_exception_handler(APIError, api_error_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip().rstrip("/") for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.routes import auth, jobs, companies, applications, resumes, admin, chat, insights, internal_ingest, saved, migrate
from fastapi import APIRouter

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(jobs.router)
api_router.include_router(saved.router)
api_router.include_router(companies.router)
api_router.include_router(applications.router)
api_router.include_router(resumes.router)
api_router.include_router(admin.router)
api_router.include_router(chat.router)
api_router.include_router(insights.router)
api_router.include_router(internal_ingest.router)
api_router.include_router(migrate.router)

app.include_router(api_router)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/internal/diagnostics")
async def diagnostics(
    request: Request,
    x_cron_secret: str = Header(None, alias="X-Cron-Secret")
):
    if x_cron_secret != settings.CRON_SECRET:
        raise HTTPException(status_code=401, detail="Invalid CRON Secret")
        
    import subprocess
    import json
    import os
    
    # Run the diagnose_apis.py script as a subprocess to keep it isolated
    # and parse its output.
    script_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "scripts", "diagnose_apis.py")
    try:
        result = subprocess.run(
            [sys.executable, script_path], 
            capture_output=True, text=True, timeout=30
        )
        
        output = result.stdout
        checks = {}
        for line in output.split('\n'):
            if line.startswith('[PASS]'):
                name = line.split(']', 1)[1].split(':', 1)[0].strip()
                checks[name] = "PASS"
            elif line.startswith('[FAIL]'):
                name = line.split(']', 1)[1].split(':', 1)[0].strip()
                checks[name] = "FAIL"
                
        has_critical_failure = any(v == "FAIL" for v in checks.values())
        status_code = 503 if has_critical_failure else 200
        
        return JSONResponse(status_code=status_code, content={"status": "fail" if has_critical_failure else "ok", "results": checks, "raw": output})
    except Exception as e:
        logger.error(f"Diagnostics execution failed: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "detail": str(e)})

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
