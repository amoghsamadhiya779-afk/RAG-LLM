from functools import lru_cache

from resume_rag.config import get_settings
from resume_rag.embeddings import build_embedding_model
from resume_rag.llm import build_answer_generator
from resume_rag.rag import ResumeRagService
from resume_rag.vector_store import JsonVectorStore


@lru_cache
def get_service() -> ResumeRagService:
    settings = get_settings()
    return ResumeRagService(
        settings=settings,
        embedding_model=build_embedding_model(settings),
        answer_generator=build_answer_generator(settings),
        vector_store=JsonVectorStore(settings.index_path),
    )
