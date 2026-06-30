import io
import os
import json
from pypdf import PdfReader
import httpx

async def parse_resume_file(file_bytes: bytes, filename: str) -> dict:
    """
    Extracts text from a PDF resume and structures it.
    Also returns a semantic embedding for the resume.
    """
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
            
        if not text.strip():
            text = "No text could be extracted from this PDF."
            
        # Call Google Gemini to extract structured data (if GEMINI_API_KEY is available)
        api_key = os.environ.get("GEMINI_API_KEY")
        parsed_data = {
            "skills": [],
            "experience": [],
            "education": [],
            "summary": "Extracted summary of the candidate based on resume text."
        }
        
        if api_key:
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.post(
                        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}",
                        headers={"Content-Type": "application/json"},
                        json={
                            "systemInstruction": {
                                "parts": [{"text": "You are a resume parser. Extract skills (list of strings), experience (list of objects with company, title, description), education (list of objects with school, degree, year), and a short 2-sentence summary. Return ONLY JSON. Do not include markdown codeblocks like ```json, just the raw JSON object."}]
                            },
                            "contents": [{"parts": [{"text": f"Extract from this resume:\n\n{text[:4000]}"}]}],
                            "generationConfig": {
                                "responseMimeType": "application/json"
                            }
                        },
                        timeout=30.0
                    )
                    if resp.status_code == 200:
                        content_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                        parsed_data = json.loads(content_text)
                    else:
                        print(f"Gemini API Error: {resp.text}")
            except Exception as e:
                print(f"Failed to use Gemini for resume parsing: {e}")
                
        # Generate an embedding for the resume summary or raw text to match against jobs
        embedding_text = parsed_data.get("summary", text[:1000])
        
        # Generate embedding using Gemini
        embedding = [0.0] * 768
        if api_key:
            try:
                from app.rag.embeddings import GeminiEmbeddingModel
                model = GeminiEmbeddingModel(api_key=api_key)
                embeddings_list = model.embed([embedding_text])
                if embeddings_list:
                    embedding = embeddings_list[0]
            except Exception as e:
                print(f"Failed to generate Gemini embedding: {e}")
        
        return {
            "parsed": parsed_data,
            "raw_text": text,
            "embedding": embedding
        }
    except Exception as e:
        print(f"Error parsing resume: {e}")
        return {
            "parsed": {"error": "Failed to parse resume"},
            "raw_text": "",
            "embedding": [0.0] * 1536
        }
