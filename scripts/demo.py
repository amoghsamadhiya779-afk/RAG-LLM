from pathlib import Path

from resume_rag.config import Settings
from resume_rag.embeddings import build_embedding_model
from resume_rag.llm import build_answer_generator
from resume_rag.rag import ResumeRagService
from resume_rag.schemas import DocumentIn
from resume_rag.vector_store import JsonVectorStore

DEMO_RESUME = """
Candidate has built a Python and FastAPI RAG service with document ingestion,
chunking, deterministic local embeddings, vector retrieval, semantic search,
grounded answer generation, source snippets, Docker support, API design,
evaluation hooks, and automated tests.

The project includes a Streamlit dashboard for resume ingestion, role matching,
retrieval-based Q&A, and skill gap planning.
"""

DEMO_JOB_DESCRIPTION = """
We need an AI engineering intern with Python, FastAPI, RAG pipelines, vector
embeddings, semantic search, evaluation, Docker, API design, and clean testing
habits.
"""


def build_demo_service() -> ResumeRagService:
    index_path = Path("data/index/demo_vector_store.json")
    if index_path.exists():
        index_path.unlink()

    settings = Settings(index_path=index_path)
    return ResumeRagService(
        settings=settings,
        embedding_model=build_embedding_model(settings),
        answer_generator=build_answer_generator(settings),
        vector_store=JsonVectorStore(settings.index_path),
    )


def main() -> None:
    service = build_demo_service()
    service.ingest(
        DocumentIn(
            text=DEMO_RESUME,
            source="inline-demo-resume",
            doc_type="resume",
        )
    )
    service.ingest(
        DocumentIn(
            text=DEMO_JOB_DESCRIPTION,
            source="inline-demo-job-description",
            doc_type="job",
        )
    )

    query = service.query(
        "What evidence proves this candidate can build RAG systems?",
        top_k=4,
        filters={"doc_type": "resume"},
    )
    print("\nANSWER\n------")
    print(query.answer)

    match = service.match_role("AI Engineering Intern", DEMO_JOB_DESCRIPTION, top_k=6)
    print("\nMATCH\n-----")
    print(match.model_dump_json(indent=2))


if __name__ == "__main__":
    main()
