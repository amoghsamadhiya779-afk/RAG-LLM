from __future__ import annotations

import json
import math
import re
import sqlite3
from dataclasses import asdict, dataclass
from pathlib import Path

from app.rag.chunking import Chunk
from app.rag.embeddings import EmbeddingModel, cosine_similarity


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


def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z0-9+#.-]+", text.lower())


class BM25:
    """Best Matching 25 (BM25) lexical ranker."""

    def __init__(self, corpus: list[tuple[str, list[str]]], k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.corpus_size = len(corpus)
        self.avgdl = sum(len(doc) for _, doc in corpus) / self.corpus_size if self.corpus_size > 0 else 1.0
        self.doc_freqs: dict[str, dict[str, int]] = {}
        self.doc_lengths: dict[str, int] = {}
        self.df: dict[str, int] = {}
        self.idf: dict[str, float] = {}
        self._initialize(corpus)

    def _initialize(self, corpus: list[tuple[str, list[str]]]):
        for chunk_id, doc in corpus:
            self.doc_lengths[chunk_id] = len(doc)
            frequencies: dict[str, int] = {}
            for word in doc:
                frequencies[word] = frequencies.get(word, 0) + 1
            self.doc_freqs[chunk_id] = frequencies
            for word in set(frequencies.keys()):
                self.df[word] = self.df.get(word, 0) + 1

        for word, freq in self.df.items():
            self.idf[word] = math.log((self.corpus_size - freq + 0.5) / (freq + 0.5) + 1.0)

    def score(self, query: list[str], chunk_id: str) -> float:
        score = 0.0
        doc_len = self.doc_lengths.get(chunk_id, 0)
        freqs = self.doc_freqs.get(chunk_id, {})
        for word in query:
            if word not in freqs:
                continue
            tf = freqs[word]
            idf = self.idf.get(word, 0.0)
            numerator = tf * (self.k1 + 1.0)
            denominator = tf + self.k1 * (1.0 - self.b + self.b * doc_len / self.avgdl)
            score += idf * (numerator / denominator)
        return score


def reciprocal_rank_fusion(
    dense_results: list[SearchResult],
    sparse_results: list[SearchResult],
    k: int = 60,
) -> list[SearchResult]:
    """Combines dense semantic and sparse lexical ranks using RRF."""
    rrf_scores: dict[str, float] = {}
    chunk_map: dict[str, StoredChunk] = {}

    for rank, res in enumerate(dense_results):
        chunk_map[res.chunk.id] = res.chunk
        rrf_scores[res.chunk.id] = rrf_scores.get(res.chunk.id, 0.0) + 1.0 / (k + rank + 1)

    for rank, res in enumerate(sparse_results):
        chunk_map[res.chunk.id] = res.chunk
        rrf_scores[res.chunk.id] = rrf_scores.get(res.chunk.id, 0.0) + 1.0 / (k + rank + 1)

    sorted_ids = sorted(rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True)
    return [SearchResult(chunk=chunk_map[c_id], score=rrf_scores[c_id]) for c_id in sorted_ids]


def _matches_filters(chunk: StoredChunk, filters: dict[str, str]) -> bool:
    for k, v in filters.items():
        if getattr(chunk, k, None) != v and chunk.metadata.get(k) != v:
            return False
    return True


class SQLiteVectorStore:
    """Production-grade persistent vector and BM25 hybrid index using SQLite."""

    def __init__(self, path: Path):
        self.db_path = path.with_suffix(".db")
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._chunks: dict[str, StoredChunk] = {}
        self._bm25_index: BM25 | None = None
        self._init_db()
        self._load_all_chunks()

    @property
    def count(self) -> int:
        return len(self._chunks)

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    def _init_db(self) -> None:
        with self._get_connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS documents (
                    source TEXT PRIMARY KEY,
                    doc_type TEXT
                );
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS chunks (
                    id TEXT PRIMARY KEY,
                    text TEXT,
                    source TEXT,
                    metadata TEXT,
                    embedding TEXT,
                    FOREIGN KEY(source) REFERENCES documents(source) ON DELETE CASCADE
                );
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS jobs (
                    id TEXT PRIMARY KEY,
                    title TEXT,
                    company TEXT,
                    skills TEXT,
                    responsibilities TEXT,
                    experience_level TEXT,
                    salary_range TEXT,
                    location TEXT,
                    tech_stack TEXT,
                    culture TEXT,
                    embedding TEXT
                );
                """
            )
            conn.commit()

    def _load_all_chunks(self) -> None:
        self._chunks.clear()
        with self._get_connection() as conn:
            cursor = conn.execute(
                "SELECT c.id, c.text, c.source, d.doc_type, c.metadata, c.embedding "
                "FROM chunks c JOIN documents d ON c.source = d.source"
            )
            for row in cursor.fetchall():
                c_id, text, source, doc_type, metadata_str, embedding_str = row
                self._chunks[c_id] = StoredChunk(
                    id=c_id,
                    text=text,
                    source=source,
                    doc_type=doc_type,
                    metadata=json.loads(metadata_str),
                    embedding=json.loads(embedding_str),
                )
        
        corpus = [(c.id, tokenize(c.text)) for c in self._chunks.values()]
        self._bm25_index = BM25(corpus)

    def add(self, chunks: list[Chunk], embedding_model: EmbeddingModel) -> int:
        embeddings = embedding_model.embed([chunk.text for chunk in chunks])
        added = 0
        with self._get_connection() as conn:
            for chunk, embedding in zip(chunks, embeddings, strict=True):
                conn.execute(
                    "INSERT OR IGNORE INTO documents (source, doc_type) VALUES (?, ?)",
                    (chunk.source, chunk.doc_type),
                )

                cursor = conn.execute("SELECT 1 FROM chunks WHERE id = ?", (chunk.id,))
                exists = cursor.fetchone() is not None
                if not exists:
                    added += 1

                conn.execute(
                    "INSERT OR REPLACE INTO chunks (id, text, source, metadata, embedding) "
                    "VALUES (?, ?, ?, ?, ?)",
                    (
                        chunk.id,
                        chunk.text,
                        chunk.source,
                        json.dumps(chunk.metadata),
                        json.dumps(embedding),
                    ),
                )
            conn.commit()

        self._load_all_chunks()
        return added

    def remove_source(self, source: str) -> int:
        with self._get_connection() as conn:
            cursor = conn.execute("SELECT COUNT(*) FROM chunks WHERE source = ?", (source,))
            count = cursor.fetchone()[0]
            conn.execute("DELETE FROM documents WHERE source = ?", (source,))
            conn.commit()

        self._load_all_chunks()
        return count

    def search(
        self,
        query: str,
        embedding_model: EmbeddingModel,
        top_k: int,
        filters: dict[str, str] | None = None,
    ) -> list[SearchResult]:
        filters = filters or {}
        chunks_to_search = [c for c in self._chunks.values() if _matches_filters(c, filters)]
        if not chunks_to_search:
            return []

        query_embedding = embedding_model.embed([query])[0]
        dense_results: list[SearchResult] = []
        for chunk in chunks_to_search:
            score = cosine_similarity(query_embedding, chunk.embedding)
            dense_results.append(SearchResult(chunk=chunk, score=score))
        dense_results = sorted(dense_results, key=lambda r: r.score, reverse=True)

        query_tokens = tokenize(query)
        sparse_results: list[SearchResult] = []
        for chunk in chunks_to_search:
            score = self._bm25_index.score(query_tokens, chunk.id) if getattr(self, '_bm25_index', None) else 0.0
            sparse_results.append(SearchResult(chunk=chunk, score=score))
        sparse_results = sorted(sparse_results, key=lambda r: r.score, reverse=True)

        merged_results = reciprocal_rank_fusion(dense_results, sparse_results)
        return merged_results[:top_k]

    def list_sources(self) -> list[dict[str, str]]:
        seen: dict[str, dict[str, str]] = {}
        for chunk in self._chunks.values():
            seen[chunk.source] = {"source": chunk.source, "doc_type": chunk.doc_type}
        return list(seen.values())

    def add_job(
        self,
        id: str,
        title: str,
        company: str,
        skills: list[str],
        responsibilities: str,
        experience_level: str,
        salary_range: str,
        location: str,
        tech_stack: list[str],
        culture: str,
        embedding_model: EmbeddingModel,
    ) -> None:
        text_to_embed = f"{title} at {company}. Experience: {experience_level}. Responsibilities: {responsibilities}. Skills: {', '.join(skills)}"
        embedding = embedding_model.embed([text_to_embed])[0]
        
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO jobs 
                (id, title, company, skills, responsibilities, experience_level, salary_range, location, tech_stack, culture, embedding)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    id,
                    title,
                    company,
                    json.dumps(skills),
                    responsibilities,
                    experience_level,
                    salary_range,
                    location,
                    json.dumps(tech_stack),
                    culture,
                    json.dumps(embedding),
                ),
            )
            conn.commit()

    def search_jobs(
        self,
        query: str,
        embedding_model: EmbeddingModel,
        top_k: int = 10,
    ) -> list[dict]:
        query_embedding = embedding_model.embed([query])[0]
        jobs = self.get_all_jobs()
        if not jobs:
            return []
            
        scored_jobs = []
        for job in jobs:
            score = cosine_similarity(query_embedding, job["embedding"])
            job_copy = dict(job)
            del job_copy["embedding"]
            job_copy["score"] = score
            scored_jobs.append(job_copy)
            
        return sorted(scored_jobs, key=lambda x: x["score"], reverse=True)[:top_k]

    def get_all_jobs(self) -> list[dict]:
        jobs = []
        with self._get_connection() as conn:
            cursor = conn.execute("SELECT * FROM jobs")
            columns = [desc[0] for desc in cursor.description]
            for row in cursor.fetchall():
                job = dict(zip(columns, row))
                job["skills"] = json.loads(job["skills"])
                job["tech_stack"] = json.loads(job["tech_stack"])
                job["embedding"] = json.loads(job["embedding"])
                jobs.append(job)
        return jobs
