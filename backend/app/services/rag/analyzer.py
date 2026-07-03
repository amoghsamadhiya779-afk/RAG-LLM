import json
import os
import re

from app.services.rag.config import Settings
from app.services.rag.embeddings import EmbeddingModel
from app.services.rag.vector_store import SQLiteVectorStore

COMMON_SKILLS = [
    "python", "go", "golang", "java", "javascript", "typescript", "c++", "c#", "rust", "scala",
    "fastapi", "flask", "django", "spring", "react", "next.js", "angular", "vue", "node.js", "express",
    "docker", "kubernetes", "k8s", "terraform", "helm", "aws", "gcp", "azure", "vault", "argocd",
    "postgresql", "postgres", "mysql", "sqlite", "redis", "mongodb", "cassandra", "snowflake", "databricks",
    "kafka", "rabbitmq", "grpc", "protobuf", "rest apis", "restful", "git", "github", "gitlab",
    "pytorch", "tensorflow", "scikit-learn", "numpy", "pandas", "mlflow", "airflow", "triton", "dvc", "ray", "cuda",
    "system design", "distributed systems", "microservices", "concurrency", "ci/cd", "agile", "scrum"
]

ACTION_VERBS = [
    "designed", "developed", "built", "implemented", "optimized", "led", "architected", "engineered",
    "scaled", "managed", "created", "delivered", "deployed", "refactored", "automated", "mentored",
    "monitored", "accelerated", "integrated", "audited", "authored", "standardized", "migrated"
]

class ResumeAnalyzer:
    def __init__(self, settings: Settings, vector_store: SQLiteVectorStore):
        self.settings = settings
        self.vector_store = vector_store

    def analyze(self, resume_text: str, openai_key: str | None = None) -> dict:
        # 1. Profile Extraction
        profile = self._extract_profile(resume_text, openai_key)
        
        # 2. ATS Score Calculation
        scoring = self._calculate_ats_score(resume_text, profile)
        
        return {
            "profile": profile,
            "scoring": scoring
        }

    def _extract_profile(self, text: str, openai_key: str | None) -> dict:
        if openai_key or self.settings.openai_api_key:
            return self._extract_profile_openai(text, openai_key or self.settings.openai_api_key)
        return self._extract_profile_local(text)

    def _extract_profile_local(self, text: str) -> dict:
        text_lower = text.lower()
        
        # Extract skills
        skills = []
        for skill in COMMON_SKILLS:
            pattern = rf"\b{re.escape(skill)}\b"
            if "+" in skill or "." in skill:
                pattern = re.escape(skill)
            if re.search(pattern, text_lower):
                standard_casing = next((s for s in COMMON_SKILLS if s == skill), skill)
                skills.append(standard_casing.capitalize() if len(standard_casing) > 3 else standard_casing.upper())
                
        # Fix specific casing issues
        skills = [
            s.replace("Fastapi", "FastAPI")
             .replace("Next.js", "Next.js")
             .replace("Docker", "Docker")
             .replace("Aws", "AWS")
             .replace("Gcp", "GCP")
             .replace("Sql", "SQL")
             .replace("Git", "Git")
             .replace("C++", "C++")
            for s in skills
        ]
        skills = list(sorted(set(skills)))
        
        # Extract years of experience
        exp_match = re.search(r"(\d+)\+?\s*(?:years?|yrs?)\b", text_lower)
        experience_years = int(exp_match.group(1)) if exp_match else 2
        
        # Extract current title
        detected_title = "Backend Engineer"
        titles = ["backend engineer", "frontend engineer", "full stack engineer", "devops engineer", "platform engineer", "machine learning engineer", "mlops engineer", "data engineer", "software engineer"]
        for t in titles:
            if t in text_lower:
                detected_title = t.title()
                break
                
        # Extract education
        education = "Bachelor's Degree in Computer Science"
        if "master" in text_lower or "m.s." in text_lower or "ms in" in text_lower:
            education = "Master's Degree in Computer Science"
        elif "phd" in text_lower or "ph.d." in text_lower:
            education = "Ph.D. in Computer Science"
            
        return {
            "skills": skills,
            "experience_years": experience_years,
            "current_title": detected_title,
            "education": education,
            "projects": [p.strip() for p in re.findall(r"project:\s*(.*?)(?=\n|$)", text, re.IGNORECASE)[:3]] or ["Personal Portfolio RAG App"],
            "achievements": [a.strip() for a in re.findall(r"(?:achieve|achievement|accomplish):\s*(.*?)(?=\n|$)", text, re.IGNORECASE)[:3]] or ["Optimized system latency by 20%"]
        }

    def _extract_profile_openai(self, text: str, api_key: str) -> dict:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        
        prompt = (
            f"You are an expert resume parsing model. Analyze the candidate resume text below and extract a structured JSON profile.\n\n"
            f"Resume Text:\n{text}\n\n"
            f"Return ONLY valid JSON with precisely these keys:\n"
            f"- skills: a list of string technical skills/technologies found.\n"
            f"- experience_years: an integer of total years of experience.\n"
            f"- current_title: a string of the current or most recent job title.\n"
            f"- education: a string representing the highest degree/education found.\n"
            f"- projects: a list of up to 3 major project names.\n"
            f"- achievements: a list of up to 3 quantified achievements (e.g. 'Reduced latency by 30%').\n"
            f"Do not wrap in markdown or prefix/suffix."
        )
        try:
            response = client.chat.completions.create(
                model=self.settings.openai_chat_model,
                temperature=0.1,
                messages=[{"role": "user", "content": prompt}]
            )
            content = response.choices[0].message.content or ""
            content = content.replace("```json", "").replace("```", "").strip()
            return json.loads(content)
        except Exception:
            return self._extract_profile_local(text)

    def _calculate_ats_score(self, text: str, profile: dict) -> dict:
        text_lower = text.lower()
        word_count = len(text.split())
        
        # 1. Formatting Check (Max 25)
        formatting_score = 0
        formatting_logs = []
        
        if 300 <= word_count <= 850:
            formatting_score += 10
            formatting_logs.append("Ideal word count (300-850 words) maintained.")
        else:
            formatting_score += 5
            formatting_logs.append(f"Word count is {word_count}. Ideal is between 300 and 850 words to avoid parsing truncation.")
            
        sections = {"education": ["education", "degree", "university", "college"], "experience": ["experience", "employment", "history", "work"], "skills": ["skills", "technologies", "expertise"]}
        sections_found = 0
        for sec, keywords in sections.items():
            if any(k in text_lower for k in keywords):
                sections_found += 1
            else:
                formatting_logs.append(f"Missing distinct section header for {sec.capitalize()}.")
        
        formatting_score += (sections_found * 5)
        
        # 2. Content Quality Scorer (Max 25)
        content_score = 0
        content_logs = []
        
        skill_count = len(profile.get("skills", []))
        if skill_count >= 10:
            content_score += 10
            content_logs.append(f"Excellent skills profile: {skill_count} key technical concepts indexed.")
        elif skill_count >= 5:
            content_score += 7
            content_logs.append(f"Moderate skills profile: {skill_count} skills indexed. Consider adding more tools/frameworks.")
        else:
            content_score += 3
            content_logs.append(f"Weak skills profile: Only {skill_count} skills found. Add specific technologies you have used.")
            
        bullets = len(re.findall(r"^[•\-\*\s]+\w+", text, re.MULTILINE))
        if bullets >= 8:
            content_score += 15
            content_logs.append(f"Good readability: {bullets} action-oriented bullet points used.")
        else:
            content_score += 8
            content_logs.append(f"Few bullet points ({bullets} found). Convert large paragraphs into bullet points for readability.")
            
        # 3. Style Scorer (Max 25)
        style_score = 0
        style_logs = []
        
        action_verb_count = sum(1 for verb in ACTION_VERBS if f" {verb}" in text_lower)
        if action_verb_count >= 6:
            style_score += 15
            style_logs.append(f"High-impact language: {action_verb_count} active power-verbs detected (e.g. designed, optimized).")
        else:
            style_score += 8
            style_logs.append(f"Low active verb density ({action_verb_count} found). Replace passive terms with active verbs like 'engineered' or 'managed'.")
            
        sentences = [s for s in re.split(r'\.|\?|\!', text) if s.strip()]
        avg_sentence_len = sum(len(s.split()) for s in sentences) / len(sentences) if sentences else 0
        if avg_sentence_len <= 18:
            style_score += 10
            style_logs.append("Sentences are concise and easy for ATS scanners to parse.")
        else:
            style_score += 5
            style_logs.append("Average sentence length is slightly high. Shorten sentences to improve readability.")
            
        # 4. Global Match Score (Max 25)
        match_score = 15
        
        total_score = formatting_score + content_score + style_score + match_score
        
        return {
            "total_score": total_score,
            "breakdown": {
                "formatting": formatting_score,
                "content": content_score,
                "style": style_score,
                "match": match_score
            },
            "logs": formatting_logs + content_logs + style_logs
        }
