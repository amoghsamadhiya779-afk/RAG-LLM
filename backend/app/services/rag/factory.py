from functools import lru_cache

from app.services.rag.analyzer import ResumeAnalyzer
from app.services.rag.config import get_settings
from app.services.rag.embeddings import build_embedding_model
from app.services.rag.llm import build_answer_generator
from app.services.rag.rag import ResumeRagService
from app.services.rag.vector_store import SQLiteVectorStore


@lru_cache
def get_service() -> ResumeRagService:
    settings = get_settings()
    vector_store = SQLiteVectorStore(settings.index_path)
    return ResumeRagService(
        settings=settings,
        embedding_model=build_embedding_model(settings),
        answer_generator=build_answer_generator(settings),
        vector_store=vector_store,
        analyzer=ResumeAnalyzer(settings, vector_store),
    )
