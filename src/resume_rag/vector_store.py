from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path

from resume_rag.chunking import Chunk
from resume_rag.embeddings import EmbeddingModel, cosine_similarity


@dataclass
class StoredChunk:
    id: str
    text: str
    source: str
    doc_type: str
    metadata: dict[str, str]
    embedding: list[float]


@dataclass
class SearchResult:
    chunk: StoredChunk
    score: float


class JsonVectorStore:
    """Small persistent vector index suitable for demos and portfolio deployments."""

    def __init__(self, path: Path):
        self.path = path
        self._chunks: dict[str, StoredChunk] = {}
        self.load()

    @property
    def count(self) -> int:
        return len(self._chunks)

    def load(self) -> None:
        if not self.path.exists():
            self._chunks = {}
            return
        payload = json.loads(self.path.read_text(encoding="utf-8"))
        self._chunks = {
            item["id"]: StoredChunk(
                id=item["id"],
                text=item["text"],
                source=item["source"],
                doc_type=item["doc_type"],
                metadata=item.get("metadata", {}),
                embedding=item["embedding"],
            )
            for item in payload.get("chunks", [])
        }

    def persist(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        payload = {"chunks": [asdict(chunk) for chunk in self._chunks.values()]}
        self.path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def add(self, chunks: list[Chunk], embedding_model: EmbeddingModel) -> int:
        embeddings = embedding_model.embed([chunk.text for chunk in chunks])
        added = 0
        for chunk, embedding in zip(chunks, embeddings, strict=True):
            if chunk.id not in self._chunks:
                added += 1
            self._chunks[chunk.id] = StoredChunk(
                id=chunk.id,
                text=chunk.text,
                source=chunk.source,
                doc_type=chunk.doc_type,
                metadata=chunk.metadata,
                embedding=embedding,
            )
        self.persist()
        return added

    def search(
        self,
        query: str,
        embedding_model: EmbeddingModel,
        top_k: int,
        filters: dict[str, str] | None = None,
    ) -> list[SearchResult]:
        filters = filters or {}
        query_embedding = embedding_model.embed([query])[0]
        results: list[SearchResult] = []
        for chunk in self._chunks.values():
            if not _matches_filters(chunk, filters):
                continue
            score = cosine_similarity(query_embedding, chunk.embedding)
            results.append(SearchResult(chunk=chunk, score=score))
        return sorted(results, key=lambda result: result.score, reverse=True)[:top_k]

    def list_sources(self) -> list[dict[str, str]]:
        seen: dict[str, dict[str, str]] = {}
        for chunk in self._chunks.values():
            seen[chunk.source] = {"source": chunk.source, "doc_type": chunk.doc_type}
        return list(seen.values())


def _matches_filters(chunk: StoredChunk, filters: dict[str, str]) -> bool:
    for key, expected in filters.items():
        if key == "doc_type" and chunk.doc_type != expected:
            return False
        if key != "doc_type" and chunk.metadata.get(key) != expected:
            return False
    return True
