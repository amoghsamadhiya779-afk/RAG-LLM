# Gemini API References and Centralization Strategy Analysis

## Executive Summary
This analysis details all hardcoded Gemini model and configuration references in the backend codebase (`C:\Users\Lenovo\Desktop\RAG & LLM\backend`). We present a complete list of these hardcoded references and propose a centralization strategy for Milestone 1 that introduces `GEMINI_MODEL` and `GEMINI_EMBED_MODEL` environment variables with no stale Python fallback defaults, ensuring configuration consistency across both settings modules.

---

## 1. Hardcoded Gemini References
The investigation identified **7 source files** (plus configuration files) containing hardcoded Gemini API references.

### 1.1. LLM Model References (`gemini-2.5-flash`)
The model `gemini-2.5-flash` is hardcoded as part of direct API endpoint URLs in the following locations:

| File Path | Line(s) | Hardcoded Code Snippet |
| :--- | :--- | :--- |
| `app/rag/llm.py` | 298 | `self.url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"` |
| `app/rag/parser.py` | 71 | `f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"` |
| `app/routers/chat.py` | 30 | `f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"` |
| `app/routers/insights.py` | 55 | `f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"` |
| `app/routers/jobs.py` | 223 | `f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"` |
| `app/routers/resumes.py` | 187 | `f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"` |

### 1.2. Embedding Model References (`text-embedding-004`)
The embedding model name `text-embedding-004` is hardcoded in the Gemini embedding implementation:

| File Path | Line(s) | Hardcoded Code Snippet |
| :--- | :--- | :--- |
| `app/rag/embeddings.py` | 58 | `self.url = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents"` |
| `app/rag/embeddings.py` | 75 | `"model": "models/text-embedding-004"` |

---

## 2. Configuration Structure & Discrepancies
The backend codebase contains **two settings modules**:
1. **Core Settings (`app/core/config.py`)**:
   - Used by the API routers (`chat.py`, `insights.py`, `jobs.py`, `resumes.py`) and `app/rag/parser.py`.
   - Uses `BaseSettings` without a prefix, meaning variables are read directly (e.g. `GEMINI_API_KEY`).
2. **RAG Settings (`app/rag/config.py`)**:
   - Used by the RAG services (`embeddings.py`, `llm.py`).
   - Uses `BaseSettings` with `env_prefix = "RESUME_RAG_"`, meaning variables are read with a prefix (e.g. `RESUME_RAG_GEMINI_API_KEY`).

### Discrepancy Note:
Currently, the routers look up the Gemini API key via:
`settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")`
Meanwhile, RAG services look it up via:
`settings.gemini_api_key or os.environ.get("GEMINI_API_KEY")`
To centralize and enforce `GEMINI_MODEL` and `GEMINI_EMBED_MODEL` environment variables across both settings modules, we should configure the RAG settings class to read these fields using `validation_alias` from the exact environment variables `GEMINI_MODEL` and `GEMINI_EMBED_MODEL` (bypassing the `RESUME_RAG_` prefix).

---

## 3. Centralization Strategy & Recommendations

### 3.1. Settings Updates
To prevent stale defaults, both settings classes should declare the model variables as optional strings with **no default string fallbacks** in the class definition.

#### A. Core Settings (`app/core/config.py`)
Add the new fields to the `Settings` class:
```python
    # AI / Gemini
    GEMINI_MODEL: str | None = None
    GEMINI_EMBED_MODEL: str | None = None
```

#### B. RAG Settings (`app/rag/config.py`)
Add the fields to the RAG `Settings` class, using `validation_alias` to bypass the `RESUME_RAG_` prefix:
```python
    from pydantic import Field

    # ... in Settings class ...
    gemini_model: str | None = Field(default=None, validation_alias="GEMINI_MODEL")
    gemini_embed_model: str | None = Field(default=None, validation_alias="GEMINI_EMBED_MODEL")
```

### 3.2. Codebase Modifications (Suggested Diffs)

#### A. `app/rag/llm.py`
Modify `GeminiAnswerGenerator` to receive the model name in its constructor, and update `build_answer_generator` to validate and supply it:

```python
# app/rag/llm.py:294
class GeminiAnswerGenerator(AnswerGenerator):
    def __init__(self, api_key: str, model_name: str):
        self.api_key = api_key
        self.model_name = model_name
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
        self.headers = {
            "Content-Type": "application/json",
            "X-goog-api-key": self.api_key
        }
```

```python
# app/rag/llm.py:421
def build_answer_generator(settings: Settings) -> AnswerGenerator:
    if settings.llm_provider == "gemini":
        api_key = settings.gemini_api_key or os.environ.get("GEMINI_API_KEY")
        if api_key:
            model_name = settings.gemini_model or os.environ.get("GEMINI_MODEL")
            if not model_name:
                raise ValueError("GEMINI_MODEL environment variable must be set when llm_provider is 'gemini'.")
            return GeminiAnswerGenerator(api_key, model_name)
        else:
            logger.warning("GEMINI_API_KEY is not set. Falling back to LocalExtractiveGenerator.")
```

#### B. `app/rag/embeddings.py`
Modify `GeminiEmbeddingModel` to receive the model name in its constructor, and update `build_embedding_model` to validate and supply it:

```python
# app/rag/embeddings.py:54
class GeminiEmbeddingModel(EmbeddingModel):
    def __init__(self, api_key: str, model_name: str):
        self.api_key = api_key
        self.model_name = model_name
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:batchEmbedContents"

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
                        "model": f"models/{self.model_name}",
                        "content": {"parts": [{"text": text}]}
                    }
                    for text in batch_texts
                ]
            }
            response = requests.post(self.url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            for item in data.get("embeddings", []):
                results.append(item["values"])
                
        return results
```

```python
# app/rag/embeddings.py:90
def build_embedding_model(settings: Settings) -> EmbeddingModel:
    if settings.embedding_provider == "gemini":
        api_key = settings.gemini_api_key or os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return LocalHashEmbedding()
        
        model_name = settings.gemini_embed_model or os.environ.get("GEMINI_EMBED_MODEL")
        if not model_name:
            raise ValueError("GEMINI_EMBED_MODEL environment variable must be set when embedding_provider is 'gemini'.")
            
        return GeminiEmbeddingModel(api_key, model_name)
```

#### C. `app/rag/parser.py`
Enforce configuration validation and replace hardcoded endpoint:
```python
# app/rag/parser.py:64
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        gemini_model = settings.GEMINI_MODEL or os.environ.get("GEMINI_MODEL")
        
        if hf_token or api_key:
            if not gemini_model:
                raise ValueError("GEMINI_MODEL environment variable is required but not configured.")
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.post(
                        f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={api_key}",
```

#### D. Router Files (`chat.py`, `insights.py`, `jobs.py`, `resumes.py`)
Retrieve model name from settings/env and raise an exception if missing before invoking the model:

**`app/routers/chat.py`**:
```python
    api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return ChatResponse(response="Gemini API Key is missing on the server. Please configure it in .env.")
        
    gemini_model = settings.GEMINI_MODEL or os.environ.get("GEMINI_MODEL")
    if not gemini_model:
        raise HTTPException(status_code=500, detail="GEMINI_MODEL environment variable is not configured.")
        
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={api_key}",
```

**`app/routers/insights.py`**:
```python
    api_key = os.environ.get("GEMINI_API_KEY") or settings.GEMINI_API_KEY
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API Key missing")
        
    gemini_model = os.environ.get("GEMINI_MODEL") or settings.GEMINI_MODEL
    if not gemini_model:
        raise HTTPException(status_code=500, detail="GEMINI_MODEL environment variable is not configured.")
        
    # ...
    resp = await client.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={api_key}",
```

**`app/routers/jobs.py`**:
```python
    api_key = os.environ.get("GEMINI_API_KEY") or settings.GEMINI_API_KEY
    if not api_key:
        return [JobWithCompanyResponse.model_validate(j) for j in jobs[:3]]
        
    gemini_model = os.environ.get("GEMINI_MODEL") or settings.GEMINI_MODEL
    if not gemini_model:
        raise HTTPException(status_code=500, detail="GEMINI_MODEL environment variable is not configured.")
        
    # ...
    resp = await client.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={api_key}",
```

**`app/routers/resumes.py`**:
```python
    api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
    gemini_model = settings.GEMINI_MODEL or os.environ.get("GEMINI_MODEL")
    
    if hf_token or api_key:
        if not gemini_model:
            raise HTTPException(status_code=500, detail="GEMINI_MODEL environment variable is not configured.")
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={api_key}",
```

### 3.3. Environment File Configuration (`.env` and `.env.example`)
To make setup simple for other developers/environments:

1. **`backend/.env.example`**:
   Add references to the configuration:
   ```ini
   # AI / Gemini Configuration
   GEMINI_MODEL=gemini-2.5-flash
   GEMINI_EMBED_MODEL=text-embedding-004
   ```
2. **`backend/.env`**:
   Append/update model variables:
   ```ini
   GEMINI_MODEL=gemini-2.5-flash
   GEMINI_EMBED_MODEL=text-embedding-004
   ```
