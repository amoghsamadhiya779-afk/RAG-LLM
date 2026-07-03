import json
from app.services.rag.analyzer import ResumeAnalyzer
from app.services.rag.config import Settings
from app.services.rag.embeddings import EmbeddingModel
from app.services.rag.vector_store import SQLiteVectorStore

class CareerIntelligenceService:
    def __init__(
        self,
        settings: Settings,
        embedding_model: EmbeddingModel,
        vector_store: SQLiteVectorStore,
        analyzer: ResumeAnalyzer,
    ):
        self.settings = settings
        self.embedding_model = embedding_model
        self.vector_store = vector_store
        self.analyzer = analyzer

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
            
        key = openai_key or self.settings.openai_api_key
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
