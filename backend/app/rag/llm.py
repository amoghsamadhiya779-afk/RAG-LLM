from __future__ import annotations

import logging
import os
from abc import ABC, abstractmethod
from collections.abc import Iterator

from app.rag.config import Settings
from app.rag.vector_store import SearchResult
from app.rag.utils.text_analysis import _extract_gaps, _extract_signal, _keyword_coverage


logger = logging.getLogger(__name__)

class AnswerGenerator(ABC):
    @abstractmethod
    def answer(self, question: str, contexts: list[SearchResult]) -> str:
        raise NotImplementedError

    @abstractmethod
    def answer_stream(self, question: str, contexts: list[SearchResult]) -> Iterator[str]:
        raise NotImplementedError

    @abstractmethod
    def evaluate_match(
        self, role_title: str, job_description: str, contexts: list[SearchResult]
    ) -> tuple[int, list[str], list[str]]:
        raise NotImplementedError

    @abstractmethod
    def generate_queries(self, question: str) -> list[str]:
        raise NotImplementedError

    @abstractmethod
    def route_query(self, question: str) -> str:
        raise NotImplementedError

    @abstractmethod
    def grade_documents(self, question: str, contexts: list[SearchResult]) -> list[SearchResult]:
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

    def answer_stream(self, question: str, contexts: list[SearchResult]) -> Iterator[str]:
        full_answer = self.answer(question, contexts)
        words = full_answer.split(" ")
        for i, word in enumerate(words):
            yield (word + " ") if i < len(words) - 1 else word

    def evaluate_match(
        self, role_title: str, job_description: str, contexts: list[SearchResult]
    ) -> tuple[int, list[str], list[str]]:


        evidence_text = " ".join(result.chunk.text for result in contexts)
        coverage = _keyword_coverage(job_description, evidence_text)
        score = min(98, max(20, round(coverage * 100)))
        strengths = _extract_signal(contexts, limit=4)
        gaps = _extract_gaps(job_description, contexts)
        return score, strengths, gaps

    def generate_queries(self, question: str) -> list[str]:
        # Simple local variation generator (Multi-Query)
        queries = [question]
        lower_q = question.lower()
        
        from app.rag.rag import _keywords
        keywords = _keywords(question)
        if keywords:
            queries.append(" ".join(keywords))
        
        # Domain specific expansions
        if "backend" in lower_q or "database" in lower_q or "api" in lower_q:
            queries.append(question + " system architecture scaling")
        if "frontend" in lower_q or "ui" in lower_q or "react" in lower_q:
            queries.append(question + " user interface state management")
            
        # Deduplicate
        return list(dict.fromkeys(queries))

    def route_query(self, question: str) -> str:
        # Simple local router
        lower_q = question.lower()
        if "job" in lower_q or "role" in lower_q or "match" in lower_q or "openings" in lower_q:
            return "job_search"
        if "hi " in lower_q or "hello" in lower_q or "what can you do" in lower_q:
            return "general"
        return "resume_search"

    def grade_documents(self, question: str, contexts: list[SearchResult]) -> list[SearchResult]:
        # Simple local document grader (CRAG concept)
        from app.rag.rag import _keywords
        q_keywords = _keywords(question)
        if not q_keywords:
            return contexts
            
        relevant = []
        for ctx in contexts:
            ctx_lower = ctx.chunk.text.lower()
            # Grade relevant if it contains at least one keyword
            if any(k in ctx_lower for k in q_keywords):
                relevant.append(ctx)
                
        return relevant


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

    def answer_stream(self, question: str, contexts: list[SearchResult]) -> Iterator[str]:
        context_text = "\n\n".join(
            f"Source: {result.chunk.source}\n{result.chunk.text}" for result in contexts
        )
        response = self.client.chat.completions.create(
            model=self.model,
            temperature=0.2,
            stream=True,
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
        for chunk in response:
            token = chunk.choices[0].delta.content or ""
            if token:
                yield token

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


            evidence_text = " ".join(result.chunk.text for result in contexts)
            coverage = _keyword_coverage(job_description, evidence_text)
            score = min(98, max(20, round(coverage * 100)))
            strengths = _extract_signal(contexts, limit=4)
            gaps = _extract_gaps(job_description, contexts)
            return score, strengths, gaps

    def generate_queries(self, question: str) -> list[str]:
        prompt = (
            f"You are an AI language model assistant. Your task is to generate 3 different "
            f"versions of the given user question to retrieve relevant documents from a vector database. "
            f"By generating multiple perspectives on the user question, your goal is to help the user "
            f"overcome some of the limitations of distance-based similarity search. "
            f"Provide these alternative questions separated by newlines.\n\n"
            f"Original question: {question}"
        )
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                temperature=0.2,
                messages=[{"role": "user", "content": prompt}],
            )
            content = response.choices[0].message.content or ""
            queries = [q.strip() for q in content.split("\n") if q.strip()]
            return [question] + queries[:3]
        except Exception:
            return [question]

    def route_query(self, question: str) -> str:
        prompt = (
            f"You are an expert router. Given a user question, route it to either 'resume_search' "
            f"or 'general'. Use 'general' for greetings or generic AI questions. Use 'resume_search' "
            f"for questions related to candidates, skills, experience, or jobs.\n\n"
            f"Question: {question}\n\n"
            f"Output ONLY one word: 'resume_search' or 'general'."
        )
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                temperature=0.0,
                messages=[{"role": "user", "content": prompt}],
            )
            content = response.choices[0].message.content or ""
            if "general" in content.lower():
                return "general"
            return "resume_search"
        except Exception:
            return "resume_search"

    def grade_documents(self, question: str, contexts: list[SearchResult]) -> list[SearchResult]:
        if not contexts:
            return []
            
        docs_text = "\n\n".join([f"Document {i}:\n{ctx.chunk.text}" for i, ctx in enumerate(contexts)])
        prompt = (
            f"You are a grader assessing relevance of retrieved documents to a user question.\n"
            f"Here are the retrieved documents:\n\n{docs_text}\n\n"
            f"Here is the user question: {question}\n\n"
            f"For each document, determine if it contains keyword(s) or semantic meaning related to the question.\n"
            f"Output ONLY a valid JSON array of integers containing the indices (0 to {len(contexts)-1}) of the relevant documents. Do not output anything else."
        )
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                temperature=0.0,
                messages=[{"role": "user", "content": prompt}],
            )
            content = response.choices[0].message.content or ""
            content = content.replace("```json", "").replace("```", "").strip()
            import json
            indices = json.loads(content)
            filtered = [contexts[i] for i in indices if isinstance(i, int) and 0 <= i < len(contexts)]
            return filtered if filtered else contexts
        except Exception:
            return contexts


class GeminiAnswerGenerator(AnswerGenerator):
    def __init__(self, api_key: str):
        self.api_key = api_key
        # Use gemini-2.5-flash as the latest standard for fast tasks
        self.url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
        self.headers = {
            "Content-Type": "application/json",
            "X-goog-api-key": self.api_key
        }

    def _call_gemini(self, prompt: str) -> str:
        import requests
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        try:
            resp = requests.post(self.url, headers=self.headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except httpx.HTTPStatusError as e:
            logger.error(f"Gemini API Error: {e.response.text}")
            raise RuntimeError(f"Gemini API failed: {e.response.text}") from e
        except Exception as e:
            logger.error(f"Gemini Exception: {e}")
            return ""

    def answer(self, question: str, contexts: list[SearchResult]) -> str:
        context_text = "\n\n".join(
            f"Source: {result.chunk.source}\n{result.chunk.text}" for result in contexts
        )
        prompt = (
            "You are a resume intelligence assistant. Answer only from the "
            "provided context. Be specific, concise, and cite source names.\n\n"
            f"Question: {question}\n\nContext:\n{context_text}"
        )
        return self._call_gemini(prompt)

    def answer_stream(self, question: str, contexts: list[SearchResult]) -> Iterator[str]:
        full_answer = self.answer(question, contexts)
        words = full_answer.split(" ")
        for i, word in enumerate(words):
            yield (word + " ") if i < len(words) - 1 else word

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
            f"Return ONLY valid JSON (no markdown block wrappers)."
        )
        content = self._call_gemini(prompt)
        content = content.replace("```json", "").replace("```", "").strip()
        try:
            data = json.loads(content)
            return int(data["match_score"]), list(data["strengths"]), list(data["gaps"])
        except Exception:


            evidence_text = " ".join(result.chunk.text for result in contexts)
            coverage = _keyword_coverage(job_description, evidence_text)
            score = min(98, max(20, round(coverage * 100)))
            strengths = _extract_signal(contexts, limit=4)
            gaps = _extract_gaps(job_description, contexts)
            return score, strengths, gaps

    def generate_queries(self, question: str) -> list[str]:
        prompt = (
            "You are an AI language model assistant. Your task is to generate 3 "
            "different versions of the given user question to retrieve relevant documents from a vector "
            "database. Provide these alternative questions separated by newlines. Original question: " + question
        )
        res = self._call_gemini(prompt)
        return [q.strip() for q in res.split("\n") if q.strip()]

    def route_query(self, question: str) -> str:
        prompt = (
            "You are an expert at routing a user question to a vectorstore or handling it generally.\n"
            "If the question is greeting ('hi', 'hello') or asking what you can do, route to 'general'.\n"
            "If the question asks about a job match or open roles, route to 'job_search'.\n"
            "Otherwise, route to 'resume_search'.\n"
            "Return ONLY a JSON object with a single key 'datasource' and value 'general', 'job_search', or 'resume_search'.\n"
            f"Question: {question}"
        )
        import json
        res = self._call_gemini(prompt)
        res = res.replace("```json", "").replace("```", "").strip()
        try:
            data = json.loads(res)
            return data.get("datasource", "resume_search")
        except Exception:
            return "resume_search"

    def grade_documents(self, question: str, contexts: list[SearchResult]) -> list[SearchResult]:
        if not contexts:
            return []
            
        docs_text = "\n\n".join([f"Document {i}:\n{ctx.chunk.text}" for i, ctx in enumerate(contexts)])
        prompt = (
            f"You are a grader assessing relevance of retrieved documents to a user question.\n"
            f"Here are the retrieved documents:\n\n{docs_text}\n\n"
            f"Here is the user question: {question}\n\n"
            f"For each document, determine if it contains keyword(s) or semantic meaning related to the question.\n"
            f"Output ONLY a valid JSON array of integers containing the indices (0 to {len(contexts)-1}) of the relevant documents. Do not output anything else."
        )
        import json
        res = self._call_gemini(prompt)
        res = res.replace("```json", "").replace("```", "").strip()
        try:
            indices = json.loads(res)
            filtered = [contexts[i] for i in indices if isinstance(i, int) and 0 <= i < len(contexts)]
            return filtered if filtered else contexts
        except Exception:
            return contexts


def build_answer_generator(settings: Settings) -> AnswerGenerator:
    if settings.llm_provider == "gemini":
        api_key = settings.gemini_api_key or os.environ.get("GEMINI_API_KEY")
        if api_key:
            return GeminiAnswerGenerator(api_key)
        else:
            logger.warning("GEMINI_API_KEY is not set. Falling back to LocalExtractiveGenerator.")
    
    if settings.llm_provider == "openai":
        api_key = settings.openai_api_key or os.environ.get("OPENAI_API_KEY")
        if api_key:
            return OpenAIAnswerGenerator(api_key, settings.openai_chat_model)
        else:
            logger.warning("OPENAI_API_KEY is not set. Falling back to LocalExtractiveGenerator.")
            
    return LocalExtractiveGenerator()
