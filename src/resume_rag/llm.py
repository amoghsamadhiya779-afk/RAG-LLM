from __future__ import annotations

import os
from abc import ABC, abstractmethod

from resume_rag.config import Settings
from resume_rag.vector_store import SearchResult


class AnswerGenerator(ABC):
    @abstractmethod
    def answer(self, question: str, contexts: list[SearchResult]) -> str:
        raise NotImplementedError

    @abstractmethod
    def evaluate_match(
        self, role_title: str, job_description: str, contexts: list[SearchResult]
    ) -> tuple[int, list[str], list[str]]:
        raise NotImplementedError


class LocalExtractiveGenerator(AnswerGenerator):
    """Creates grounded answers without network access."""

    def answer(self, question: str, contexts: list[SearchResult]) -> str:
        if not contexts:
            return "I could not find enough evidence in the indexed resume materials."

        best = contexts[:3]
        bullets = []
        for result in best:
            text = " ".join(result.chunk.text.split())
            bullets.append(f"- {text[:420]}")

        return (
            f"Based on the indexed evidence, the strongest answer to '{question}' is:\n"
            + "\n".join(bullets)
            + "\n\nUse the cited sources below to verify every claim."
        )

    def evaluate_match(
        self, role_title: str, job_description: str, contexts: list[SearchResult]
    ) -> tuple[int, list[str], list[str]]:
        from resume_rag.rag import _extract_gaps, _extract_signal, _keyword_coverage

        evidence_text = " ".join(result.chunk.text for result in contexts)
        coverage = _keyword_coverage(job_description, evidence_text)
        score = min(98, max(20, round(coverage * 100)))
        strengths = _extract_signal(contexts, limit=4)
        gaps = _extract_gaps(job_description, contexts)
        return score, strengths, gaps


class OpenAIAnswerGenerator(AnswerGenerator):
    def __init__(self, api_key: str, model: str):
        from openai import OpenAI

        self.client = OpenAI(api_key=api_key)
        self.model = model

    def answer(self, question: str, contexts: list[SearchResult]) -> str:
        context_text = "\n\n".join(
            f"Source: {result.chunk.source}\n{result.chunk.text}" for result in contexts
        )
        response = self.client.chat.completions.create(
            model=self.model,
            temperature=0.2,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a resume intelligence assistant. Answer only from the "
                        "provided context. Be specific, concise, and cite source names."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Question: {question}\n\nContext:\n{context_text}",
                },
            ],
        )
        return response.choices[0].message.content or ""

    def evaluate_match(
        self, role_title: str, job_description: str, contexts: list[SearchResult]
    ) -> tuple[int, list[str], list[str]]:
        import json

        context_text = "\n\n".join(
            f"Source: {result.chunk.source}\n{result.chunk.text}" for result in contexts
        )
        prompt = (
            f"You are a professional HR recruiter. Evaluate the candidate's resume credentials against the target job role:\n\n"
            f"Role Title: {role_title}\n"
            f"Job Description: {job_description}\n\n"
            f"Retrieved Candidate Resume Evidence:\n{context_text}\n\n"
            f"Analyze and output a JSON object with the following fields:\n"
            f"- match_score: an integer from 0 to 100 representing the match confidence.\n"
            f"- strengths: a list of up to 4 major strengths/matching qualifications.\n"
            f"- gaps: a list of up to 4 critical missing qualifications or experience gaps.\n"
            f"Return ONLY valid JSON (no markdown block wrappers or conversational prefix/suffix)."
        )
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                temperature=0.2,
                messages=[
                    {"role": "system", "content": "You are a professional recruiting evaluator."},
                    {"role": "user", "content": prompt},
                ],
            )
            content = response.choices[0].message.content or ""
            content = content.replace("```json", "").replace("```", "").strip()
            data = json.loads(content)
            return int(data["match_score"]), list(data["strengths"]), list(data["gaps"])
        except Exception:
            from resume_rag.rag import _extract_gaps, _extract_signal, _keyword_coverage

            evidence_text = " ".join(result.chunk.text for result in contexts)
            coverage = _keyword_coverage(job_description, evidence_text)
            score = min(98, max(20, round(coverage * 100)))
            strengths = _extract_signal(contexts, limit=4)
            gaps = _extract_gaps(job_description, contexts)
            return score, strengths, gaps


def build_answer_generator(settings: Settings) -> AnswerGenerator:
    if settings.llm_provider == "openai":
        api_key = settings.openai_api_key or os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("RESUME_RAG_OPENAI_API_KEY or OPENAI_API_KEY is required for OpenAI generation.")
        return OpenAIAnswerGenerator(api_key, settings.openai_chat_model)
    return LocalExtractiveGenerator()
