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
    question: str = Field(..., min_length=1)
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
    job_description: str = Field(..., min_length=10)
    top_k: int = Field(default=8, ge=1, le=15)
    source_doc: str | None = None


class MatchResponse(BaseModel):
    role_title: str
    match_score: int
    strengths: list[str]
    gaps: list[str]
    evidence: list[SourceSnippet]


# ATS Career Intelligence Schemas
class ResumeAnalyzeRequest(BaseModel):
    text: str
    openai_key: str | None = None


class CandidateProfile(BaseModel):
    skills: list[str] = Field(default_factory=list)
    experience_years: int = Field(default=0)
    current_title: str = Field(default="Candidate")
    education: str = Field(default="Not specified")
    projects: list[str] = Field(default_factory=list)
    achievements: list[str] = Field(default_factory=list)


class ScoreBreakdown(BaseModel):
    formatting: int
    content: int
    style: int
    match: int


class AtsScoring(BaseModel):
    total_score: int
    breakdown: ScoreBreakdown
    logs: list[str]


class ResumeAnalyzeResponse(BaseModel):
    profile: CandidateProfile
    scoring: AtsScoring


class AtsMatchRequest(BaseModel):
    profile: CandidateProfile
    top_k: int | None = 10


class MatchedJob(BaseModel):
    id: str
    title: str
    company: str
    match_score: int
    skills: list[str]
    skill_match_percentage: int
    missing_skills: list[str]
    salary_range: str
    location: str
    tech_stack: list[str]
    culture: str
    experience_level: str
    application_confidence: str
    href: str | None = None


class UpgradeRequest(BaseModel):
    profile: CandidateProfile
    learned_skills: list[str]


class UpgradeResponse(BaseModel):
    new_scores: dict[str, int]


class InterviewRequest(BaseModel):
    job_id: str
    profile: CandidateProfile


class InterviewQuestion(BaseModel):
    type: str
    question: str
    answer_guide: str


class InterviewResponse(BaseModel):
    questions: list[InterviewQuestion]
