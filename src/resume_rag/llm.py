from __future__ import annotations

import os
from abc import ABC, abstractmethod

from resume_rag.config import Settings
from resume_rag.vector_store import SearchResult


class AnswerGenerator(ABC):
    @abstractmethod
    def answer(self, question: str, contexts: list[SearchResult]) -> str:
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


def build_answer_generator(settings: Settings) -> AnswerGenerator:
    if settings.llm_provider == "openai":
        api_key = settings.openai_api_key or os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("RESUME_RAG_OPENAI_API_KEY or OPENAI_API_KEY is required for OpenAI generation.")
        return OpenAIAnswerGenerator(api_key, settings.openai_chat_model)
    return LocalExtractiveGenerator()
