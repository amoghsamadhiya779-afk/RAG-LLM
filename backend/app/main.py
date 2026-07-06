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

        # Ensure all tables are created (creates missing tables, like AtsReport)
        from app.db.base import Base
        from app.db.session import engine
        from app.db.models import AtsReport
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database schemas ensured.")
            
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

from app.api.routes import auth, jobs, companies, applications, resumes, admin, chat, insights, internal_ingest, saved, migrate, search
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
api_router.include_router(search.router, prefix="/search")

from app.core.deps import require_user, get_current_profile
from app.db.models import User, Profile
from fastapi import Depends

@api_router.get("/me")
async def get_me(
    user: User = Depends(require_user),
    profile: Profile = Depends(get_current_profile)
):
    return {
        "id": str(profile.user_id),
        "email": user.email,
        "full_name": profile.full_name,
        "avatar_url": profile.avatar_url,
        "role": profile.role.value if profile.role else None
    }

from pydantic import BaseModel
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.db.session import get_db
from app.db.models import SavedJob, Application, Resume

class MigrateVisitorPayload(BaseModel):
    from_visitor_id: str
    to_user_id: str
    snapshot: Dict[str, Any]

@api_router.post("/me/migrate")
async def migrate_me(
    payload: MigrateVisitorPayload,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    if str(user.id) != payload.to_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    from_uuid = payload.from_visitor_id
    to_uuid = str(user.id)

    # 1. Saved Jobs
    visitor_saved = await db.execute(select(SavedJob).where(SavedJob.user_id == from_uuid))
    visitor_saved = visitor_saved.scalars().all()
    saved_count = 0
    for sj in visitor_saved:
        existing = await db.execute(select(SavedJob).where(SavedJob.user_id == to_uuid, SavedJob.job_id == sj.job_id))
        if not existing.scalar_one_or_none():
            sj.user_id = to_uuid
            saved_count += 1
        else:
            await db.delete(sj)
            
    # 2. Applications
    visitor_apps = await db.execute(select(Application).where(Application.user_id == from_uuid))
    visitor_apps = visitor_apps.scalars().all()
    app_count = 0
    for app in visitor_apps:
        existing = await db.execute(select(Application).where(Application.user_id == to_uuid, Application.job_id == app.job_id))
        if not existing.scalar_one_or_none():
            app.user_id = to_uuid
            app_count += 1
        else:
            await db.delete(app)
            
    # 3. Resumes
    result = await db.execute(
        update(Resume).where(Resume.user_id == from_uuid).values(user_id=to_uuid)
    )
    resume_count = result.rowcount

    await db.commit()

    return {
        "ok": True,
        "merged": {
            "saved_jobs": saved_count,
            "applications": app_count,
            "ats_reports": 0,
            "resume": resume_count > 0
        }
    }

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
