# Architecture Notes

## Design Goals

The project is intentionally structured like a deployable AI service rather than a notebook. Each RAG concern has a boundary:

- `documents.py`: file loading and document normalization.
- `chunking.py`: deterministic chunk creation and metadata propagation.
- `embeddings.py`: interchangeable local and OpenAI embedding providers.
- `vector_store.py`: persistent vector index abstraction.
- `llm.py`: interchangeable local and OpenAI answer generators.
- `rag.py`: application orchestration and role-match logic.
- `api.py`: FastAPI transport layer.

## Why a Local Vector Store Exists

Portfolio projects often fail in demos because they require API keys or managed infrastructure. The local JSON vector store makes the app runnable in interviews, CI, and offline review. The interfaces are separated so FAISS, Pinecone, or pgvector can replace it without changing API contracts.

## Grounding Strategy

Answers are generated only after retrieval. Responses return source snippets and scores so claims can be audited. In OpenAI mode, the system prompt instructs the model to answer only from retrieved context.

## Production Upgrade Path

- Replace `JsonVectorStore` with FAISS for local high-performance search.
- Replace `JsonVectorStore` with Pinecone or pgvector for hosted multi-user deployments.
- Add OpenTelemetry spans around ingestion, embedding, retrieval, and generation.
- Add user/session IDs and authorization if the service stores private resumes.
