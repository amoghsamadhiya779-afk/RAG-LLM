from __future__ import annotations

import hashlib
import math
import os
import re
from abc import ABC, abstractmethod
from collections import Counter

from app.services.rag.config import Settings

TOKEN_RE = re.compile(r"[a-zA-Z][a-zA-Z0-9+#.-]{1,}")


class EmbeddingModel(ABC):
    @abstractmethod
    def embed(self, texts: list[str]) -> list[list[float]]:
        raise NotImplementedError


class LocalHashEmbedding(EmbeddingModel):
    """Deterministic embedding model for local demos and CI."""

    def __init__(self, dimensions: int = 384):
        self.dimensions = dimensions

    def embed(self, texts: list[str]) -> list[list[float]]:
        return [self._embed_one(text) for text in texts]

    def _embed_one(self, text: str) -> list[float]:
        tokens = TOKEN_RE.findall(text.lower())
        counts = Counter(tokens)
        vector = [0.0] * self.dimensions
        for token, count in counts.items():
            digest = hashlib.blake2b(token.encode("utf-8"), digest_size=8).digest()
            bucket = int.from_bytes(digest, "big") % self.dimensions
            sign = 1.0 if digest[0] % 2 == 0 else -1.0
            vector[bucket] += sign * (1.0 + math.log(count))
        return _normalize(vector)


class OpenAIEmbedding(EmbeddingModel):
    def __init__(self, api_key: str, model: str):
        from openai import OpenAI

        self.client = OpenAI(api_key=api_key)
        self.model = model

    def embed(self, texts: list[str]) -> list[list[float]]:
        response = self.client.embeddings.create(model=self.model, input=texts)
        return [item.embedding for item in response.data]


class GeminiEmbeddingModel(EmbeddingModel):
    def __init__(self, api_key: str, model: str):
        from app.core.gemini_client import get_gemini_client
        self.client = get_gemini_client()
        self.model = model

    def embed(self, texts: list[str]) -> list[list[float]]:
        results = []
        batch_size = 100
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i + batch_size]
            response = self.client.models.embed_content(
                model=self.model,
                contents=batch_texts,
            )
            for item in response.embeddings:
                results.append(item.values)
                
        return results


def build_embedding_model(settings: Settings) -> EmbeddingModel:
    if settings.embedding_provider == "gemini":
        from app.core.config import settings as core_settings
        api_key = core_settings.GEMINI_API_KEY
        if not api_key:
            return LocalHashEmbedding()
        model = settings.GEMINI_EMBED_MODEL or core_settings.GEMINI_EMBED_MODEL
        return GeminiEmbeddingModel(api_key, model)
    if settings.embedding_provider == "openai":
        api_key = settings.openai_api_key
        if not api_key:
            raise ValueError("RESUME_RAG_OPENAI_API_KEY or OPENAI_API_KEY is required for OpenAI embeddings.")
        return OpenAIEmbedding(api_key, settings.openai_embedding_model)
    return LocalHashEmbedding()


def cosine_similarity(a: list[float], b: list[float]) -> float:
    if len(a) != len(b):
        raise ValueError("Vectors must have the same dimensions")
    return sum(x * y for x, y in zip(a, b, strict=True))


def _normalize(vector: list[float]) -> list[float]:
    magnitude = math.sqrt(sum(value * value for value in vector))
    if magnitude == 0:
        return vector
    return [value / magnitude for value in vector]
