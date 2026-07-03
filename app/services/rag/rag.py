from collections.abc import Iterator

from app.rag.analyzer import ResumeAnalyzer
from app.rag.config import Settings
from app.rag.embeddings import EmbeddingModel
from app.rag.llm import AnswerGenerator
from app.rag.schemas import (
    DocumentIn,
    IngestResponse,
    MatchResponse,
    QueryResponse,
    SourceSnippet,
)
from app.rag.vector_store import SQLiteVectorStore
from app.rag.services.ingest import IngestService
from app.rag.services.query import QueryService
from app.rag.services.match import MatchService
from app.rag.services.career import CareerIntelligenceService

class ResumeRagService:
    def __init__(
        self,
        settings: Settings,
        embedding_model: EmbeddingModel,
        answer_generator: AnswerGenerator,
        vector_store: SQLiteVectorStore,
        analyzer: ResumeAnalyzer,
    ):
        self.settings = settings
        self.embedding_model = embedding_model
        self.answer_generator = answer_generator
        self.vector_store = vector_store
        self.analyzer = analyzer
        
        self.ingest_service = IngestService(settings, embedding_model, vector_store)
        self.query_service = QueryService(settings, embedding_model, answer_generator, vector_store)
        self.match_service = MatchService(settings, embedding_model, answer_generator, vector_store)
        self.career_service = CareerIntelligenceService(settings, embedding_model, vector_store, analyzer)

    def ingest(self, document: DocumentIn) -> IngestResponse:
        return self.ingest_service.ingest(document)

    def sources(self) -> list[dict[str, str]]:
        return self.ingest_service.sources()

    def delete_source(self, source: str) -> int:
        return self.ingest_service.delete_source(source)

    def query(
        self,
        question: str,
        top_k: int | None = None,
        filters: dict[str, str] | None = None,
    ) -> QueryResponse:
        return self.query_service.query(question, top_k, filters)

    def query_stream(
        self,
        question: str,
        top_k: int | None = None,
        filters: dict[str, str] | None = None,
    ) -> tuple[list[SourceSnippet], Iterator[str]]:
        return self.query_service.query_stream(question, top_k, filters)

    def match_role(self, role_title: str, job_description: str, top_k: int, source_doc: str | None = None) -> MatchResponse:
        return self.match_service.match_role(role_title, job_description, top_k, source_doc)

    def analyze_resume(self, text: str, openai_key: str | None = None) -> dict:
        return self.career_service.analyze_resume(text, openai_key)

    def match_jobs(self, profile: dict, top_k: int = 10) -> list[dict]:
        return self.career_service.match_jobs(profile, top_k)

    def upgrade_skills(self, profile: dict, learned_skills: list[str]) -> dict:
        return self.career_service.upgrade_skills(profile, learned_skills)

    def generate_interview_prep(self, job_id: str, profile: dict, openai_key: str | None = None) -> list[dict]:
        return self.career_service.generate_interview_prep(job_id, profile, openai_key)
