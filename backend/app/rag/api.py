import json
import os
from typing import Annotated

from fastapi import Depends, FastAPI, File, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.rag.config import Settings, get_settings
from app.rag.document_parser import parse_document
from app.rag.factory import get_service
from app.rag.rag import ResumeRagService
from app.rag.schemas import (
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
from app.rag.seeder import seed_jobs

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Resume RAG Command Center",
    version="0.1.0",
    description=(
        "A production-style RAG API for resume evidence, role matching, "
        "and interview prep."
    ),
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "X-OpenAI-Key", "X-API-Key"],
)

SettingsDep = Annotated[Settings, Depends(get_settings)]
ServiceDep = Annotated[ResumeRagService, Depends(get_service)]

def verify_api_key(
    settings: SettingsDep,
    x_api_key: str | None = Header(default=None)
):
    if x_api_key != settings.backend_api_key:
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return x_api_key

AuthDep = Annotated[str | None, Depends(verify_api_key)]


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
@limiter.limit("10/minute")
def ingest_document(request: Request, document: DocumentIn, service: ServiceDep, auth: AuthDep) -> IngestResponse:
    return service.ingest(document)


@app.get("/documents")
def list_documents(service: ServiceDep, auth: AuthDep) -> list[dict[str, str]]:
    return service.sources()


@app.delete("/documents/{source}")
def delete_document(source: str, service: ServiceDep, auth: AuthDep) -> dict[str, str | int]:
    deleted_count = service.delete_source(source)
    return {
        "status": "deleted",
        "source": source,
        "chunks_removed": deleted_count,
    }


@app.post("/query", response_model=QueryResponse)
def query(request: QueryRequest, service: ServiceDep, auth: AuthDep) -> QueryResponse:
    return service.query(request.question, top_k=request.top_k, filters=request.filters)


@app.post("/query/stream")
@limiter.limit("10/minute")
def query_stream(request: Request, body: QueryRequest, service: ServiceDep, auth: AuthDep) -> StreamingResponse:
    sources, token_stream = service.query_stream(
        body.question, top_k=body.top_k, filters=body.filters
    )

    def generator():
        sources_list = [source.model_dump() for source in sources]
        yield f"data: {json.dumps({'sources': sources_list})}\n\n"
        for token in token_stream:
            yield f"data: {json.dumps({'token': token})}\n\n"

    return StreamingResponse(generator(), media_type="text/event-stream")


@app.post("/match", response_model=MatchResponse)
def match_role(request: MatchRequest, service: ServiceDep, auth: AuthDep) -> MatchResponse:
    return service.match_role(
        role_title=request.role_title,
        job_description=request.job_description,
        top_k=request.top_k,
        source_doc=request.source_doc,
    )


@app.post("/analyze/resume", response_model=ResumeAnalyzeResponse)
def analyze_resume(
    request: ResumeAnalyzeRequest,
    service: ServiceDep,
    auth: AuthDep,
    x_openai_key: str | None = Header(default=None),
) -> ResumeAnalyzeResponse:
    api_key = request.openai_key or x_openai_key
    analysis = service.analyze_resume(request.text, api_key)
    return ResumeAnalyzeResponse(profile=analysis["profile"], scoring=analysis["scoring"])

@app.post("/upload/resume")
@limiter.limit("10/minute")
async def upload_resume_endpoint(request: Request, auth: AuthDep, file: UploadFile = File(...)): # noqa: B008
    try:
        content = await file.read()
        text = parse_document(content, file.filename)
        if not text.strip():
            raise ValueError("No extractable text found.")
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

@app.post("/analyze/match", response_model=list[MatchedJob])
@limiter.limit("5/minute")
def match_jobs(request: Request, body: AtsMatchRequest, service: ServiceDep, auth: AuthDep) -> list[MatchedJob]:
    return service.match_jobs(body.profile.model_dump(), body.top_k or 10)


@app.post("/analyze/upgrade", response_model=UpgradeResponse)
def upgrade_skills(request: UpgradeRequest, service: ServiceDep, auth: AuthDep) -> UpgradeResponse:
    new_scores = service.upgrade_skills(request.profile.model_dump(), request.learned_skills)
    return UpgradeResponse(new_scores=new_scores)


@app.post("/analyze/interview", response_model=InterviewResponse)
def generate_interview(
    request: InterviewRequest,
    service: ServiceDep,
    auth: AuthDep,
    x_openai_key: str | None = Header(default=None),
) -> InterviewResponse:
    questions = service.generate_interview_prep(
        request.job_id,
        request.profile.model_dump(),
        x_openai_key,
    )
    return InterviewResponse(questions=questions)


@app.post("/jobs/seed")
def seed_jobs_endpoint(service: ServiceDep, auth: AuthDep) -> dict[str, str | int]:
    count = seed_jobs(service.vector_store, service.embedding_model)
    return {
        "status": "seeded",
        "count": count
    }
