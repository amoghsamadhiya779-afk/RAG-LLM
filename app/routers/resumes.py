import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.session import get_db
from app.schemas.schemas import ResumeResponse, ParsedResume
from app.repositories.resume_repo import ResumeRepository
from app.core.deps import get_current_user, require_role
from app.models.models import User, RoleEnum

router = APIRouter(prefix="/resumes", tags=["resumes"])

from fastapi import BackgroundTasks
from app.rag.parser import parse_resume_file

from app.db.session import AsyncSessionLocal

async def process_resume_bg(resume_id: uuid.UUID, file_bytes: bytes, filename: str):
    # Parse and embed the resume
    result = await parse_resume_file(file_bytes, filename)
    async with AsyncSessionLocal() as db:
        repo = ResumeRepository(db)
        await repo.update_parsed(resume_id, result["parsed"], result["embedding"])

@router.post("", response_model=ResumeResponse)
async def upload_resume(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: User = Depends(require_role([RoleEnum.seeker])),
    db: AsyncSession = Depends(get_db)
):
    repo = ResumeRepository(db)
    resume = await repo.create(user.id, file.filename)
    
    file_bytes = await file.read()
    background_tasks.add_task(process_resume_bg, resume.id, file_bytes, file.filename)
    
    return ResumeResponse.model_validate(resume)

@router.get("/mine", response_model=List[ResumeResponse])
async def get_my_resumes(
    user: User = Depends(require_role([RoleEnum.seeker])),
    db: AsyncSession = Depends(get_db)
):
    repo = ResumeRepository(db)
    resumes = await repo.get_mine(user.id)
    return [ResumeResponse.model_validate(r) for r in resumes]

@router.post("/{resume_id}/parse", response_model=ParsedResume)
async def parse_resume(
    resume_id: uuid.UUID,
    user: User = Depends(require_role([RoleEnum.seeker])),
    db: AsyncSession = Depends(get_db)
):
    repo = ResumeRepository(db)
    resume = await repo.get_by_id(resume_id)
    if not resume or resume.user_id != user.id:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    # In real implementation: wait for async parsing to finish, or do synchronous parsing if requested.
    # We will return the parsed data if available.
    if not resume.parsed:
        raise HTTPException(status_code=400, detail="Resume not parsed yet")
        
    return ParsedResume(**resume.parsed)
