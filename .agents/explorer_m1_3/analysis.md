# Milestone 1: Centralizing Gemini Configuration - Investigation & Strategy Report

## Executive Summary
This report documents the current references to Gemini models and configuration across the backend application located at `C:\Users\Lenovo\Desktop\RAG & LLM\backend`. 
Currently, the LLM model name `gemini-2.5-flash` is hardcoded across multiple FastAPI router files and the RAG query engine. Similarly, the Gemini embedding model name `text-embedding-004` is hardcoded in the embedding model service. 
To achieve **Milestone 1**, we propose:
1. Introducing two new environment variables: `GEMINI_MODEL` (for LLM content generation) and `GEMINI_EMBED_MODEL` (for embedding generation).
2. Updating configuration schemas in `app/core/config.py` and `app/rag/config.py` to expose these variables without hardcoded/stale fallbacks.
3. Modifying all relevant backend routes and services to consume these settings dynamically.
4. Updating `.env` and `.env.example` configurations.

---

## 1. Detailed Findings: Gemini Model & Config References

Below is the list of all files, lines, and exact code snippets that currently contain hardcoded Gemini model strings or require configuration updates.

### A. Hardcoded LLM Model (`gemini-2.5-flash`)
The model `gemini-2.5-flash` is hardcoded in 6 files across the codebase, specifically in request URLs targeting the Gemini API endpoint `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`.

1. **`app/rag/llm.py`**
   - **Line 297-298**: Hardcoded API URL for standard answer generation.
     ```python
     # Use gemini-2.5-flash as the latest standard for fast tasks
     self.url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
     ```
2. **`app/rag/parser.py`**
   - **Line 71**: Direct Gemini call during resume parsing.
     ```python
     f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
     ```
3. **`app/routers/chat.py`**
   - **Line 30**: Direct chat interaction.
     ```python
     f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
     ```
4. **`app/routers/insights.py`**
   - **Line 55**: Skill gap analysis API request.
     ```python
     f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
     ```
5. **`app/routers/jobs.py`**
   - **Line 223**: ATS job matching API request.
     ```python
     f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
     ```
6. **`app/routers/resumes.py`**
   - **Line 187**: Resume ATS scoring API request.
     ```python
     f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
     ```

### B. Hardcoded Embedding Model (`text-embedding-004`)
The Gemini embedding model `text-embedding-004` is hardcoded in the embedding generation class.

1. **`app/rag/embeddings.py`**
   - **Line 58**: Hardcoded endpoint URL.
     ```python
     self.url = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents"
     ```
   - **Line 75**: Hardcoded model value inside request payload JSON.
     ```python
     "model": "models/text-embedding-004",
     ```

### C. Config and Settings Files
1. **`app/core/config.py`**
   - Defines central settings loaded from `.env`. Currently includes `GEMINI_API_KEY`, but lacks fields for LLM and embedding model names.
2. **`app/rag/config.py`**
   - Defines RAG-specific settings loaded with prefix `RESUME_RAG_`. Currently lacks Gemini model and embedding model settings.
3. **`.env` & `.env.example`**
   - Lacks explicit `GEMINI_MODEL` and `GEMINI_EMBED_MODEL` declarations. Currently uses `EMBEDDING_MODEL_NAME=gemini-embedding-2` in `.env` and `EMBEDDING_MODEL_NAME=text-embedding-004` in `.env.example`, which is inconsistent and misleading.

---

## 2. Proposed Centralization Strategy

### Core Goal
- Define the models centrally in `.env` using environment variables `GEMINI_MODEL` and `GEMINI_EMBED_MODEL`.
- Ensure Pydantic Settings classes load them.
- Avoid *stale fallback defaults* (e.g., if the user asks to use Gemini but hasn't set `GEMINI_MODEL`, we raise a configuration error rather than silently defaulting to `"gemini-2.5-flash"`).

---

## 3. Recommended Code Changes

### Step 1: Update `.env.example` and `.env`
Add the centralized environment variables.

**`backend/.env.example`**:
```ini
# Gemini Models Configuration
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBED_MODEL=text-embedding-004
```

**`backend/.env`**:
```ini
# Gemini Models Configuration
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBED_MODEL=text-embedding-004
```

---

### Step 2: Update Configuration Definition Files

We must declare these settings in both config files. Since `app/rag/config.py` uses an environment prefix (`RESUME_RAG_`), we should use `validation_alias` in Pydantic to ensure it reads the global, non-prefixed `GEMINI_MODEL` and `GEMINI_EMBED_MODEL` variables directly.

#### A. **`backend/app/core/config.py`**
Add fields to `Settings` class without default strings (or with `None` default to avoid breaking startup for non-Gemini setups, but enforced at instantiation).

```python
class Settings(BaseSettings):
    PROJECT_NAME: str = "DevBoard API"
    ...
    # AI / Embeddings
    OPENAI_API_KEY: str = ""
    SERPER_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str | None = None
    GEMINI_EMBED_MODEL: str | None = None
    EMBEDDING_MODEL_NAME: str = "text-embedding-3-small"
    EMBEDDING_DIMENSION: int = 1536
```

#### B. **`backend/app/rag/config.py`**
Add fields to the RAG Settings class using `validation_alias` to bypass `RESUME_RAG_` prefix.

```python
from pydantic import Field

class Settings(BaseSettings):
    ...
    openai_embedding_model: str = "text-embedding-3-small"
    openai_chat_model: str = "gpt-4o-mini"
    
    # Centralized Gemini configurations mapped directly to global environment variables
    gemini_model: str | None = Field(default=None, validation_alias="GEMINI_MODEL")
    gemini_embed_model: str | None = Field(default=None, validation_alias="GEMINI_EMBED_MODEL")
    ...
```

---

### Step 3: Refactor RAG Code & Services

#### A. **`backend/app/rag/embeddings.py`**
Update `GeminiEmbeddingModel` and `build_embedding_model` to accept the model parameter and validate it.

```python
class GeminiEmbeddingModel(EmbeddingModel):
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:batchEmbedContents"

    def embed(self, texts: list[str]) -> list[list[float]]:
        import requests
        headers = {
            "Content-Type": "application/json",
            "X-goog-api-key": self.api_key
        }
        
        results = []
        batch_size = 100
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i + batch_size]
            payload = {
                "requests": [
                    {
                        "model": f"models/{self.model}",
                        "content": {"parts": [{"text": text}]}
                    }
                    for text in batch_texts
                ]
            }
            response = requests.post(self.url, headers=headers, json=payload)
            response.raise_for_status()
            ...
```

```python
def build_embedding_model(settings: Settings) -> EmbeddingModel:
    if settings.embedding_provider == "gemini":
        api_key = settings.gemini_api_key or os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return LocalHashEmbedding()
        
        # Enforce that the embedding model is configured
        if not settings.gemini_embed_model:
            raise ValueError("GEMINI_EMBED_MODEL is not configured in environment variables.")
            
        return GeminiEmbeddingModel(api_key, settings.gemini_embed_model)
    ...
```

#### B. **`backend/app/rag/llm.py`**
Update `GeminiAnswerGenerator` and `build_answer_generator` to accept the model parameter and validate it.

```python
class GeminiAnswerGenerator(AnswerGenerator):
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        self.headers = {
            "Content-Type": "application/json",
            "X-goog-api-key": self.api_key
        }
    ...
```

```python
def build_answer_generator(settings: Settings) -> AnswerGenerator:
    if settings.llm_provider == "gemini":
        api_key = settings.gemini_api_key or os.environ.get("GEMINI_API_KEY")
        if api_key:
            if not settings.gemini_model:
                raise ValueError("GEMINI_MODEL is not configured in environment variables.")
            return GeminiAnswerGenerator(api_key, settings.gemini_model)
        else:
            logger.warning("GEMINI_API_KEY is not set. Falling back to LocalExtractiveGenerator.")
    ...
```

---

### Step 4: Refactor Router Endpoints and parser

For all the routes directly using `httpx.AsyncClient` to call Gemini, check if `settings.GEMINI_MODEL` is populated, and raise an HTTP error or ValueError if missing.

#### A. **`backend/app/rag/parser.py`**
```python
        hf_token = os.environ.get("HF_TOKEN")
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        
        if hf_token or api_key:
            if not settings.GEMINI_MODEL:
                raise ValueError("GEMINI_MODEL is not configured in settings.")
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.post(
                        f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={api_key}",
                        ...
```

#### B. **`backend/app/routers/chat.py`**
```python
    api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return ChatResponse(response="Gemini API Key is missing on the server. Please configure it in .env.")
        
    if not settings.GEMINI_MODEL:
        raise HTTPException(status_code=500, detail="GEMINI_MODEL is not configured on the server.")
        
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={api_key}",
                ...
```

#### C. **`backend/app/routers/insights.py`**
```python
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API Key missing")
        
    if not settings.GEMINI_MODEL:
        raise HTTPException(status_code=500, detail="GEMINI_MODEL environment variable is missing")
        
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={api_key}",
                ...
```

#### D. **`backend/app/routers/jobs.py`**
```python
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or not settings.GEMINI_MODEL:
        # Graceful fallback to latest jobs if Gemini not configured
        return [JobWithCompanyResponse.model_validate(j) for j in jobs[:3]]
        
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={api_key}",
                ...
```

#### E. **`backend/app/routers/resumes.py`**
```python
    if hf_token or api_key:
        if not settings.GEMINI_MODEL:
            # fallback to default empty scoring report or raise configuration error
            pass
        else:
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.post(
                        f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={api_key}",
                        ...
```

---

## 4. Verification and Testing Strategy

Once implemented, the following verification checks should be executed:
1. **Mock-based testing**: Run pytest to verify the mocking pipeline still passes:
   ```bash
   pytest tests/test_pipeline.py
   ```
2. **Missing Env Validation Check**: Temporary comment out `GEMINI_MODEL` and `GEMINI_EMBED_MODEL` in `.env` and verify that the application correctly throws validation errors (e.g. `ValueError`) when trying to generate embeddings or call LLM functions rather than falling back to `"gemini-2.5-flash"` or `"text-embedding-004"`.
3. **Manual verification**: Call endpoints `/chat`, `/insights/skill-gap`, `/jobs/recommendations` with the updated configuration active to verify correct runtime execution.
