from resume_rag.chunking import chunk_document
from resume_rag.embeddings import LocalHashEmbedding
from resume_rag.schemas import DocumentIn
from resume_rag.vector_store import JsonVectorStore


def test_vector_store_retrieves_relevant_resume_chunk(tmp_path):
    store = JsonVectorStore(tmp_path / "vectors.json")
    embeddings = LocalHashEmbedding()
    document = DocumentIn(
        text=(
            "Built a FastAPI RAG pipeline with vector embeddings and semantic search.\n\n"
            "Also created a SQL analytics dashboard for product metrics."
        ),
        source="resume.md",
        doc_type="resume",
    )
    chunks = chunk_document(document, chunk_size=120, overlap=20)

    store.add(chunks, embeddings)
    results = store.search("semantic search embeddings RAG", embeddings, top_k=2)

    assert results
    assert "RAG pipeline" in results[0].chunk.text
    assert store.count == len(chunks)
