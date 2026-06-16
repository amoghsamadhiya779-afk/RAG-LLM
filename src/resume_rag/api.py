import json
from typing import Annotated

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from resume_rag.config import Settings, get_settings
from resume_rag.document_parser import parse_document
from resume_rag.factory import get_service
from resume_rag.rag import ResumeRagService
from resume_rag.schemas import (
    AtsMatchRequest,
    DocumentIn,
    IngestResponse,
    InterviewRequest,
    InterviewResponse,
    MatchedJob,
    MatchRequest,
    MatchResponse,
    QueryRequest,
    QueryResponse,
    ResumeAnalyzeRequest,
    ResumeAnalyzeResponse,
    UpgradeRequest,
    UpgradeResponse,
)
from resume_rag.seeder import seed_jobs

app = FastAPI(
    title="Resume RAG Command Center",
    version="0.1.0",
    description=(
        "A production-style RAG API for resume evidence, role matching, "
        "and interview prep."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SettingsDep = Annotated[Settings, Depends(get_settings)]
ServiceDep = Annotated[ResumeRagService, Depends(get_service)]


@app.get("/")
def root():
    return {"status": "Resume RAG API is running"}

@app.get("/health")
def health(settings: SettingsDep, service: ServiceDep) -> dict[str, str | int]:
    return {
        "status": "ok",
        "environment": settings.environment,
        "indexed_chunks": service.vector_store.count,
    }


@app.post("/documents", response_model=IngestResponse)
def ingest_document(document: DocumentIn, service: ServiceDep) -> IngestResponse:
    return service.ingest(document)


@app.get("/documents")
def list_documents(service: ServiceDep) -> list[dict[str, str]]:
    return service.sources()


@app.delete("/documents/{source}")
def delete_document(source: str, service: ServiceDep) -> dict[str, str | int]:
    deleted_count = service.delete_source(source)
    return {
        "status": "deleted",
        "source": source,
        "chunks_removed": deleted_count,
    }


@app.post("/query", response_model=QueryResponse)
def query(request: QueryRequest, service: ServiceDep) -> QueryResponse:
    return service.query(request.question, top_k=request.top_k, filters=request.filters)


@app.post("/query/stream")
def query_stream(request: QueryRequest, service: ServiceDep) -> StreamingResponse:
    sources, token_stream = service.query_stream(
        request.question, top_k=request.top_k, filters=request.filters
    )

    def generator():
        sources_list = [source.model_dump() for source in sources]
        yield f"data: {json.dumps({'sources': sources_list})}\n\n"
        for token in token_stream:
            yield f"data: {json.dumps({'token': token})}\n\n"

    return StreamingResponse(generator(), media_type="text/event-stream")


@app.post("/match", response_model=MatchResponse)
def match_role(request: MatchRequest, service: ServiceDep) -> MatchResponse:
    return service.match_role(
        role_title=request.role_title,
        job_description=request.job_description,
        top_k=request.top_k,
    )


@app.post("/analyze/resume", response_model=ResumeAnalyzeResponse)
def analyze_resume(
    request: ResumeAnalyzeRequest,
    service: ServiceDep,
    x_openai_key: str | None = Header(default=None),
) -> ResumeAnalyzeResponse:
    # 1. Use openai_key from body if provided (legacy), else use Header
    api_key = request.openai_key or x_openai_key
    
    # 2. Extract profile (uses LLM or falls back to regex)
    analysis = service.analyze_resume(request.text, api_key)
    return ResumeAnalyzeResponse(profile=analysis["profile"], scoring=analysis["scoring"])

@app.post("/upload/resume")
async def upload_resume_endpoint(file: UploadFile = File(...)): # noqa: B008
    """Accepts a PDF or DOCX and returns extracted text."""
    try:
        content = await file.read()
        text = parse_document(content, file.filename)
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

@app.post("/analyze/match", response_model=list[MatchedJob])
def match_jobs(request: AtsMatchRequest, service: ServiceDep) -> list[MatchedJob]:
    return service.match_jobs(request.profile.model_dump(), request.top_k or 10)


@app.post("/analyze/upgrade", response_model=UpgradeResponse)
def upgrade_skills(request: UpgradeRequest, service: ServiceDep) -> UpgradeResponse:
    new_scores = service.upgrade_skills(request.profile.model_dump(), request.learned_skills)
    return UpgradeResponse(new_scores=new_scores)


@app.post("/analyze/interview", response_model=InterviewResponse)
def generate_interview(
    request: InterviewRequest,
    service: ServiceDep,
    x_openai_key: str | None = Header(default=None),
) -> InterviewResponse:
    questions = service.generate_interview_prep(
        request.job_id,
        request.profile.model_dump(),
        x_openai_key,
    )
    return InterviewResponse(questions=questions)


@app.post("/jobs/seed")
def seed_jobs_endpoint(service: ServiceDep) -> dict[str, str | int]:
    count = seed_jobs(service.vector_store, service.embedding_model)
    return {
        "status": "seeded",
        "count": count
    }

