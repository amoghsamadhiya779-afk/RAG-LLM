from typing import Any

from pydantic import BaseModel, Field


class DocumentIn(BaseModel):
    text: str = Field(..., min_length=20)
    source: str = Field(..., examples=["resume.pdf", "job-description.md"])
    doc_type: str = Field(default="general", examples=["resume", "job", "portfolio"])
    metadata: dict[str, Any] = Field(default_factory=dict)


class IngestResponse(BaseModel):
    document_id: str
    chunks_added: int
    total_chunks: int


class QueryRequest(BaseModel):
    question: str = Field(..., min_length=3)
    top_k: int | None = Field(default=None, ge=1, le=12)
    filters: dict[str, str] = Field(default_factory=dict)


class SourceSnippet(BaseModel):
    source: str
    doc_type: str
    score: float
    text: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceSnippet]


class MatchRequest(BaseModel):
    role_title: str
    job_description: str = Field(..., min_length=50)
    top_k: int = Field(default=8, ge=1, le=15)


class MatchResponse(BaseModel):
    role_title: str
    match_score: int
    strengths: list[str]
    gaps: list[str]
    evidence: list[SourceSnippet]
