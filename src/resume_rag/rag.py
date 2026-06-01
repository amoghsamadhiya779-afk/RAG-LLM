from __future__ import annotations

import re

from resume_rag.chunking import chunk_document
from resume_rag.config import Settings
from resume_rag.embeddings import EmbeddingModel
from resume_rag.llm import AnswerGenerator
from resume_rag.schemas import (
    DocumentIn,
    IngestResponse,
    MatchResponse,
    QueryResponse,
    SourceSnippet,
)
from resume_rag.vector_store import JsonVectorStore, SearchResult


class ResumeRagService:
    def __init__(
        self,
        settings: Settings,
        embedding_model: EmbeddingModel,
        answer_generator: AnswerGenerator,
        vector_store: JsonVectorStore,
    ):
        self.settings = settings
        self.embedding_model = embedding_model
        self.answer_generator = answer_generator
        self.vector_store = vector_store

    def ingest(self, document: DocumentIn) -> IngestResponse:
        chunks = chunk_document(
            document,
            chunk_size=self.settings.chunk_size,
            overlap=self.settings.chunk_overlap,
        )
        added = self.vector_store.add(chunks, self.embedding_model)
        document_id = document.metadata.get("document_id", document.source)
        return IngestResponse(
            document_id=str(document_id),
            chunks_added=added,
            total_chunks=self.vector_store.count,
        )

    def query(
        self,
        question: str,
        top_k: int | None = None,
        filters: dict[str, str] | None = None,
    ) -> QueryResponse:
        results = self.vector_store.search(
            question,
            self.embedding_model,
            top_k=top_k or self.settings.top_k,
            filters=filters,
        )
        return QueryResponse(
            answer=self.answer_generator.answer(question, results),
            sources=[_to_source(result) for result in results],
        )

    def match_role(self, role_title: str, job_description: str, top_k: int) -> MatchResponse:
        results = self.vector_store.search(
            job_description,
            self.embedding_model,
            top_k=top_k,
            filters={"doc_type": "resume"},
        )
        evidence_text = " ".join(result.chunk.text for result in results)
        coverage = _keyword_coverage(job_description, evidence_text)
        score = min(98, max(20, round(coverage * 100)))
        strengths = _extract_signal(results, limit=4)
        gaps = _extract_gaps(job_description, results)
        return MatchResponse(
            role_title=role_title,
            match_score=score,
            strengths=strengths,
            gaps=gaps,
            evidence=[_to_source(result) for result in results],
        )

    def sources(self) -> list[dict[str, str]]:
        return self.vector_store.list_sources()


def _to_source(result: SearchResult) -> SourceSnippet:
    return SourceSnippet(
        source=result.chunk.source,
        doc_type=result.chunk.doc_type,
        score=round(result.score, 4),
        text=result.chunk.text,
        metadata=result.chunk.metadata,
    )


def _extract_signal(results: list[SearchResult], limit: int) -> list[str]:
    if not results:
        return ["No resume evidence has been indexed yet."]
    strengths: list[str] = []
    for result in results[:limit]:
        text = " ".join(result.chunk.text.split())
        strengths.append(text[:180])
    return strengths


def _extract_gaps(job_description: str, results: list[SearchResult]) -> list[str]:
    evidence = " ".join(result.chunk.text.lower() for result in results)
    desired = _keywords(job_description)
    missing = [keyword for keyword in desired if keyword not in evidence]
    if not missing:
        return ["No obvious keyword gaps found in the retrieved resume evidence."]
    return [f"Add concrete evidence for: {keyword}" for keyword in missing[:5]]


def _keyword_coverage(job_description: str, evidence: str) -> float:
    desired = _keywords(job_description)
    if not desired:
        return 0.5
    evidence_lower = evidence.lower()
    matched = sum(1 for keyword in desired if keyword in evidence_lower)
    return matched / len(desired)


def _keywords(text: str) -> list[str]:
    tokens = re.findall(r"[a-zA-Z][a-zA-Z0-9+#.-]{2,}", text.lower())
    stopwords = {
        "and",
        "the",
        "for",
        "with",
        "that",
        "you",
        "are",
        "will",
        "have",
        "from",
        "this",
        "role",
        "team",
        "work",
        "build",
        "using",
    }
    ranked = []
    for token in tokens:
        if token not in stopwords and token not in ranked:
            ranked.append(token)
    return ranked[:24]
