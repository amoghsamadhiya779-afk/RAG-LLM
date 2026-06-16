from __future__ import annotations

import json
import os
import re
from collections.abc import Iterator

from resume_rag.analyzer import ResumeAnalyzer
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
        analyzer: ResumeAnalyzer,
    ):
        self.settings = settings
        self.embedding_model = embedding_model
        self.answer_generator = answer_generator
        self.vector_store = vector_store
        self.analyzer = analyzer

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

    def query(
        self,
        question: str,
        top_k: int | None = None,
        filters: dict[str, str] | None = None,
    ) -> QueryResponse:
        # 1. Routing
        route = self.answer_generator.route_query(question)
        if route == "general":
            return QueryResponse(answer="I am a Resume Intelligence Assistant. Please ask me about candidate skills, experience, or job matching.", sources=[])
            
        # 2. Query Translation (Multi-Query)
        queries = self.answer_generator.generate_queries(question)
        all_results = []
        for q in queries:
            results = self.vector_store.search(
                q,
                self.embedding_model,
                top_k=top_k or self.settings.top_k,
                filters=filters,
            )
            all_results.append(results)
            
        # 3. Retrieval Ranking (RAG-Fusion)
        fused_results = self._reciprocal_rank_fusion(all_results, top_n=top_k or self.settings.top_k)
        
        # 4. Refinement (CRAG / Document Grading)
        graded_results = self.answer_generator.grade_documents(question, fused_results)

        return QueryResponse(
            answer=self.answer_generator.answer(question, graded_results),
            sources=[_to_source(result) for result in graded_results],
        )

    def query_stream(
        self,
        question: str,
        top_k: int | None = None,
        filters: dict[str, str] | None = None,
    ) -> tuple[list[SourceSnippet], Iterator[str]]:
        # 1. Routing
        route = self.answer_generator.route_query(question)
        if route == "general":
            def gen():
                yield "I am a Resume Intelligence Assistant. Please ask me about candidate skills, experience, or job matching."
            return [], gen()
            
        # 2. Query Translation (Multi-Query)
        queries = self.answer_generator.generate_queries(question)
        all_results = []
        for q in queries:
            results = self.vector_store.search(
                q,
                self.embedding_model,
                top_k=top_k or self.settings.top_k,
                filters=filters,
            )
            all_results.append(results)
            
        # 3. Retrieval Ranking (RAG-Fusion)
        fused_results = self._reciprocal_rank_fusion(all_results, top_n=top_k or self.settings.top_k)
        
        # 4. Refinement (CRAG / Document Grading)
        graded_results = self.answer_generator.grade_documents(question, fused_results)

        sources = [_to_source(result) for result in graded_results]
        token_stream = self.answer_generator.answer_stream(question, graded_results)
        return sources, token_stream

    def match_role(self, role_title: str, job_description: str, top_k: int, source_doc: str | None = None) -> MatchResponse:
        filters = {"doc_type": "resume"}
        if source_doc:
            filters["source"] = source_doc
            
        results = self.vector_store.search(
            job_description,
            self.embedding_model,
            top_k=top_k,
            filters=filters,
        )
        score, strengths, gaps = self.answer_generator.evaluate_match(
            role_title=role_title, job_description=job_description, contexts=results
        )
        return MatchResponse(
            role_title=role_title,
            match_score=score,
            strengths=strengths,
            gaps=gaps,
            evidence=[_to_source(result) for result in results],
        )

    def sources(self) -> list[dict[str, str]]:
        return self.vector_store.list_sources()

    def delete_source(self, source: str) -> int:
        return self.vector_store.remove_source(source)

    def analyze_resume(self, text: str, openai_key: str | None = None) -> dict:
        return self.analyzer.analyze(text, openai_key)

    def match_jobs(self, profile: dict, top_k: int = 10) -> list[dict]:
        skills = profile.get("skills", [])
        title = profile.get("current_title", "Software Engineer")
        query = f"{title} with skills {', '.join(skills)}"
        
        raw_jobs = self.vector_store.search_jobs(query, self.embedding_model, top_k=top_k)
        
        matched_jobs = []
        for job in raw_jobs:
            job_skills = set([s.lower() for s in job["skills"]])
            cand_skills = set([s.lower() for s in skills])
            
            overlap = job_skills.intersection(cand_skills)
            skill_match_pct = round(len(overlap) / len(job_skills) * 100) if job_skills else 100
            
            sim_score = job.get("score", 0.5) * 100
            match_score = round((sim_score * 0.4) + (skill_match_pct * 0.6))
            match_score = min(100, max(0, match_score))
            
            missing_skills = [s for s in job["skills"] if s.lower() not in cand_skills]
            
            if match_score >= 75:
                confidence = "HIGH"
            elif match_score >= 55:
                confidence = "MEDIUM"
            elif match_score >= 35:
                confidence = "STRETCH"
            else:
                confidence = "AVOID"
                
            matched_jobs.append({
                "id": job["id"],
                "title": job["title"],
                "company": job["company"],
                "match_score": match_score,
                "skills": job["skills"],
                "skill_match_percentage": skill_match_pct,
                "missing_skills": missing_skills,
                "salary_range": job["salary_range"],
                "location": job["location"],
                "tech_stack": job["tech_stack"],
                "culture": job["culture"],
                "experience_level": job["experience_level"],
                "application_confidence": confidence,
                "href": None
            })
            
        # Live Web Search
        try:
            from googlesearch import search
            live_query = f'{title} "{", ".join(skills[:3])}" job site:linkedin.com/jobs OR site:indeed.com'
            
            search_results = search(live_query, num_results=top_k, advanced=True)
            for idx, r in enumerate(search_results):
                match_score = max(50, 95 - (idx * 3))
                confidence = "HIGH" if match_score >= 75 else "MEDIUM"
                matched_jobs.append({
                    "id": f"live-{idx}",
                    "title": r.title[:60] + "..." if hasattr(r, 'title') and r.title else "Live Job Role",
                    "company": "Live Web Result",
                    "match_score": match_score,
                    "skills": [],
                    "skill_match_percentage": 100,
                    "missing_skills": [],
                    "salary_range": "N/A",
                    "location": "Remote / See Link",
                    "tech_stack": [],
                    "culture": r.description[:120] + "..." if hasattr(r, 'description') and r.description else "",
                    "experience_level": "N/A",
                    "application_confidence": confidence,
                    "href": r.url if hasattr(r, 'url') else ""
                })

        except Exception as e:
            print(f"Live search failed: {e}")
            
        # Sort combined results by match score descending
        matched_jobs.sort(key=lambda x: x["match_score"], reverse=True)
            
        return matched_jobs[:top_k]

    def upgrade_skills(self, profile: dict, learned_skills: list[str]) -> dict:
        current_skills = list(profile.get("skills", []))
        extended_skills = list(set(current_skills + learned_skills))
        extended_profile = {**profile, "skills": extended_skills}
        
        matches = self.match_jobs(extended_profile, top_k=50)
        return {m["id"]: m["match_score"] for m in matches}

    def generate_interview_prep(self, job_id: str, profile: dict, openai_key: str | None = None) -> list[dict]:
        all_jobs = self.vector_store.get_all_jobs()
        job = next((j for j in all_jobs if j["id"] == job_id), None)
        if not job:
            return []
            
        key = openai_key or os.environ.get("OPENAI_API_KEY")
        if key:
            from openai import OpenAI
            client = OpenAI(api_key=key)
            prompt = (
                f"You are a Senior Engineering Manager. Generate a tailored interview preparation guide for this candidate:\n\n"
                f"Candidate Title: {profile['current_title']}\n"
                f"Candidate Skills: {', '.join(profile['skills'])}\n\n"
                f"Target Job: {job['title']} at {job['company']}\n"
                f"Target Job Skills: {', '.join(job['skills'])}\n"
                f"Target Job Responsibilities: {job['responsibilities']}\n\n"
                f"Generate exactly 7 questions partitioned into these types:\n"
                f"- 3 'technical' questions evaluating core technology stacks of the job.\n"
                f"- 3 'behavioral' questions evaluating collaboration and past achievements.\n"
                f"- 1 'system design' question tailored to the job's responsibilities.\n\n"
                f"Return ONLY a valid JSON array of objects, each with these exact keys:\n"
                f"- type: either 'technical', 'behavioral', or 'system_design'.\n"
                f"- question: the interview question string.\n"
                f"- answer_guide: bullet points explaining what the interviewer is looking for in a strong response.\n"
                f"Do not include markdown blocks or conversational wrappers."
            )
            try:
                response = client.chat.completions.create(
                    model=self.settings.openai_chat_model,
                    temperature=0.2,
                    messages=[{"role": "user", "content": prompt}]
                )
                content = response.choices[0].message.content or ""
                content = content.replace("```json", "").replace("```", "").strip()
                return json.loads(content)
            except Exception:
                pass
                
        title = job["title"]
        skills = job["skills"]
        tech = skills[0] if skills else "System Architecture"
        
        return [
            {
                "type": "technical",
                "question": f"Can you explain your experience working with {tech} and how you implement it in production?",
                "answer_guide": "Looking for depth of understanding, scaling considerations, testing practices, and pitfalls to avoid."
            },
            {
                "type": "technical",
                "question": "How do you handle database migrations and ensure zero-downtime when working with databases like PostgreSQL/Redis?",
                "answer_guide": "Assess migration tooling, locking issues, rollback strategies, and cache invalidation patterns."
            },
            {
                "type": "technical",
                "question": "Describe how you package services using Docker and manage container health/logs in staging or production.",
                "answer_guide": "Evaluate Dockerfile optimizations, multi-stage builds, monitoring metrics, and resource limits."
            },
            {
                "type": "behavioral",
                "question": "Tell me about a time you made a significant technical mistake. How did you identify it, and what did you do to remediate it?",
                "answer_guide": "Look for extreme ownership, structured troubleshooting, post-mortem discipline, and preventative improvements."
            },
            {
                "type": "behavioral",
                "question": "Describe a conflict you had with a product manager or another engineer regarding architecture. How did you align?",
                "answer_guide": "Check communication skills, compromise mechanisms, objective evaluation criteria (RFCs), and focus on user metrics."
            },
            {
                "type": "behavioral",
                "question": "How do you prioritize tech debt vs feature velocity in a fast-paced release environment?",
                "answer_guide": "Evaluate pragmatic prioritization, metrics tracking (slowing delivery), and creating clean refactor roadmaps."
            },
            {
                "type": "system_design",
                "question": f"Design a high-throughput microservice system that ingests events, caches metadata, and writes to a database for a role like {title}.",
                "answer_guide": "Assess modular layout, load-balancing, queue buffers (Kafka/RabbitMQ), cache layers, and partitioning."
            }
        ]

    def _reciprocal_rank_fusion(self, results_list: list[list[SearchResult]], k: int = 60, top_n: int = 4) -> list[SearchResult]:
        fused_scores = {}
        chunk_map = {}
        for results in results_list:
            for rank, result in enumerate(results):
                chunk_id = result.chunk.id
                if chunk_id not in chunk_map:
                    chunk_map[chunk_id] = result
                if chunk_id not in fused_scores:
                    fused_scores[chunk_id] = 0.0
                fused_scores[chunk_id] += 1 / (rank + k)
                
        sorted_chunks = sorted(fused_scores.items(), key=lambda x: x[1], reverse=True)
        
        fused_results = []
        for chunk_id, _score in sorted_chunks[:top_n]:
            fused_results.append(chunk_map[chunk_id])
            
        return fused_results

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
