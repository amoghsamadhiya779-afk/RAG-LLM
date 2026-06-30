from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, jobs, companies, applications, resumes, admin
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

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

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/ready")
async def ready():
    # In production, verify DB and Redis connections here
    return {"status": "ready"}
