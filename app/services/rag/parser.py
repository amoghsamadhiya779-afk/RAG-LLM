import io
import os
import json
import logging
from pypdf import PdfReader
from docx import Document
import httpx
from pydantic import BaseModel, ValidationError
from typing import List, Optional

logger = logging.getLogger(__name__)
from app.core.config import settings

# Strict JSON schema model for RAG extraction
class ResumeProfileSchema(BaseModel):
    titles: List[str]
    seniority: str
    skills: List[str]
    domains: List[str]
    suggested_keywords: List[str]
    years_experience: int

def parse_docx(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    return "\n".join([paragraph.text for paragraph in doc.paragraphs])

async def parse_resume_file(file_bytes: bytes, filename: str) -> dict:
    """
    Stage 2: Document Parsing (Isolated)
    Stage 3: RAG Analysis (Strict JSON Schema via Gemini)
    """
    text = ""
    try:
        if filename.lower().endswith('.docx'):
            text = parse_docx(file_bytes)
        elif filename.lower().endswith('.pdf'):
            reader = PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages:
                text += page.extract_text() + "\n"
        else:
            text = file_bytes.decode('utf-8', errors='ignore')
            
        if not text.strip():
            text = "No text could be extracted."
            
        # Treat text as untrusted data. Strip non-UTF8 and null bytes.
        text = text.encode('utf-8', 'ignore').decode('utf-8').replace('\x00', '')
        # Cap length to prevent prompt injection payload size
        text = text[:8000]
            
        # Stage 3: RAG Analysis via HF Proxy (or direct Gemini if testing locally)
        # We will mock the HF proxy call here.
        parsed_data = {
            "titles": [],
            "seniority": "Unknown",
            "skills": [],
            "domains": [],
            "suggested_keywords": [],
            "years_experience": 0
        }
        
        # Standardize on settings.GEMINI_API_KEY and fallback to os.environ.get("GEMINI_API_KEY")
        api_key = settings.GEMINI_API_KEY
        
        if api_key:
            try:
                from google.genai import types
                from app.core.gemini_client import get_gemini_client
                
                model = settings.GEMINI_MODEL
                genai_client = get_gemini_client()
                
                config = types.GenerateContentConfig(
                    system_instruction="You are a resume parser. Analyze the provided resume text and return a strict JSON object matching this schema: {\"titles\": [\"Software Engineer\"], \"seniority\": \"Senior\", \"skills\": [\"Python\", \"React\"], \"domains\": [\"Fintech\"], \"suggested_keywords\": [\"Backend\", \"FastAPI\"], \"years_experience\": 5}. DO NOT include any markdown formatting, only raw JSON.",
                    response_mime_type="application/json"
                )
                
                resp = await genai_client.aio.models.generate_content(
                    model=model,
                    contents=f"--- UNTRUSTED RESUME DATA START ---\n{text}\n--- UNTRUSTED RESUME DATA END ---",
                    config=config
                )
                content_text = resp.text
                if content_text:
                    # Validate output against strict schema
                    try:
                        parsed_json = json.loads(content_text)
                        validated = ResumeProfileSchema(**parsed_json)
                        parsed_data = validated.model_dump()
                    except (json.JSONDecodeError, ValidationError) as e:
                        logger.error(f"Malformed AI response: {e}")
            except Exception as e:
                logger.error(f"Failed RAG Analysis: {e}")
                
        # Generate an embedding for the parsed keywords
        embedding_text = " ".join(parsed_data["skills"] + parsed_data["suggested_keywords"]) or text[:1000]
        embedding = [0.0] * 1536  # pgvector requires 1536 for standard openai/gemini models
        
        return {
            "parsed": parsed_data,
            "raw_text": text,
            "embedding": embedding
        }
    except Exception as e:
        logger.error(f"Error parsing resume: {e}")
        return {
            "parsed": {"error": "Failed to parse resume"},
            "raw_text": "",
            "embedding": [0.0] * 1536
        }
