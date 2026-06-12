from pathlib import Path

from resume_rag.analyzer import ResumeAnalyzer
from resume_rag.config import Settings
from resume_rag.embeddings import LocalHashEmbedding
from resume_rag.llm import LocalExtractiveGenerator
from resume_rag.rag import ResumeRagService
from resume_rag.schemas import DocumentIn
from resume_rag.vector_store import JsonVectorStore


def test_rag_service_answers_with_sources(tmp_path: Path):
    settings = Settings(index_path=tmp_path / "vectors.json", top_k=2)
    vector_store = JsonVectorStore(settings.index_path)
    analyzer = ResumeAnalyzer(settings=settings, vector_store=vector_store)
    service = ResumeRagService(
        settings=settings,
        embedding_model=LocalHashEmbedding(),
        answer_generator=LocalExtractiveGenerator(),
        vector_store=vector_store,
        analyzer=analyzer,
    )
    service.ingest(
        DocumentIn(
            text=(
                "Amogh built a Resume RAG Command Center using FastAPI, "
                "embeddings, and citations."
            ),
            source="resume.md",
            doc_type="resume",
        )
    )

    response = service.query("What RAG project did Amogh build?")

    assert response.sources
    assert "Resume RAG Command Center" in response.answer


def test_rag_service_query_stream(tmp_path: Path):
    settings = Settings(index_path=tmp_path / "vectors.json", top_k=2)
    vector_store = JsonVectorStore(settings.index_path)
    analyzer = ResumeAnalyzer(settings=settings, vector_store=vector_store)
    service = ResumeRagService(
        settings=settings,
        embedding_model=LocalHashEmbedding(),
        answer_generator=LocalExtractiveGenerator(),
        vector_store=vector_store,
        analyzer=analyzer,
    )
    service.ingest(
        DocumentIn(
            text=(
                "Amogh built a Resume RAG Command Center using FastAPI, "
                "embeddings, and citations."
            ),
            source="resume.md",
            doc_type="resume",
        )
    )

    sources, token_stream = service.query_stream("What RAG project did Amogh build?")

    assert sources
    tokens = list(token_stream)
    assert tokens
    full_answer = "".join(tokens)
    assert "Resume RAG Command Center" in full_answer
