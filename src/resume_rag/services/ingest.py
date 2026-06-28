from resume_rag.chunking import chunk_document
from resume_rag.config import Settings
from resume_rag.embeddings import EmbeddingModel
from resume_rag.schemas import DocumentIn, IngestResponse
from resume_rag.vector_store import SQLiteVectorStore

class IngestService:
    def __init__(self, settings: Settings, embedding_model: EmbeddingModel, vector_store: SQLiteVectorStore):
        self.settings = settings
        self.embedding_model = embedding_model
        self.vector_store = vector_store

    def ingest(self, document: DocumentIn) -> IngestResponse:
        chunks = chunk_document(
            document,
            chunk_size=self.settings.chunk_size,
            overlap=self.settings.chunk_overlap,
        )
        if not chunks:
            raise ValueError("No chunks generated from the document. The text might be empty.")
        added = self.vector_store.add(chunks, self.embedding_model)
        document_id = document.metadata.get("document_id", document.source)
        return IngestResponse(
            document_id=str(document_id),
            chunks_added=added,
            total_chunks=self.vector_store.count,
        )

    def sources(self) -> list[dict[str, str]]:
        return self.vector_store.list_sources()

    def delete_source(self, source: str) -> int:
        return self.vector_store.remove_source(source)
