from resume_rag.chunking import chunk_document
from resume_rag.schemas import DocumentIn


def test_chunk_document_preserves_metadata_and_overlap_constraints():
    document = DocumentIn(
        text=("RAG systems need chunking, embeddings, retrieval, and evaluation. " * 30),
        source="resume.md",
        doc_type="resume",
        metadata={"candidate": "Amogh"},
    )

    chunks = chunk_document(document, chunk_size=180, overlap=30)

    assert len(chunks) > 1
    assert chunks[0].source == "resume.md"
    assert chunks[0].doc_type == "resume"
    assert chunks[0].metadata["candidate"] == "Amogh"
