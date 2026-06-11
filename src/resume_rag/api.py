from typing import Annotated

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from resume_rag.config import Settings, get_settings
from resume_rag.factory import get_service
from resume_rag.rag import ResumeRagService
from resume_rag.schemas import (
    DocumentIn,
    IngestResponse,
    MatchRequest,
    MatchResponse,
    QueryRequest,
    QueryResponse,
)

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


@app.post("/match", response_model=MatchResponse)
def match_role(request: MatchRequest, service: ServiceDep) -> MatchResponse:
    return service.match_role(
        role_title=request.role_title,
        job_description=request.job_description,
        top_k=request.top_k,
    )
