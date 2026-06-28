from resume_rag.config import Settings
from resume_rag.embeddings import EmbeddingModel
from resume_rag.llm import AnswerGenerator
from resume_rag.schemas import MatchResponse, SourceSnippet
from resume_rag.vector_store import SQLiteVectorStore, SearchResult
from resume_rag.services.query import _to_source

class MatchService:
    def __init__(
        self,
        settings: Settings,
        embedding_model: EmbeddingModel,
        answer_generator: AnswerGenerator,
        vector_store: SQLiteVectorStore,
    ):
        self.settings = settings
        self.embedding_model = embedding_model
        self.answer_generator = answer_generator
        self.vector_store = vector_store

    def match_role(self, role_title: str, job_description: str, top_k: int, source_doc: str | None = None) -> MatchResponse:
        filters = {"doc_type": "resume"}
        if source_doc:
            filters["source"] = source_doc
            
        results = self.vector_store.search(
            job_description,
            self.embedding_model,
            top_k=top_k,
            filters=filters,
        )
        score, strengths, gaps = self.answer_generator.evaluate_match(
            role_title=role_title, job_description=job_description, contexts=results
        )
        return MatchResponse(
            role_title=role_title,
            match_score=score,
            strengths=strengths,
            gaps=gaps,
            evidence=[_to_source(result) for result in results],
        )
