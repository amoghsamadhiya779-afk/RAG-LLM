# Analysis: Centralizing Gemini API Configuration (Milestone 1)

## Executive Summary
This report analyzes references to the Gemini API models and configuration in the backend codebase located at `C:\Users\Lenovo\Desktop\RAG & LLM\backend`. 
Currently, the LLM model name (`gemini-2.5-flash`) and the embedding model name (`text-embedding-004`) are hardcoded across multiple files, and the `GEMINI_API_KEY` is retrieved using inconsistent patterns (sometimes from Pydantic core settings, sometimes from Pydantic RAG settings, and sometimes directly from `os.environ`).

We propose a strategy to:
1. **Centralize the model definitions** into `GEMINI_MODEL` and `GEMINI_EMBED_MODEL` environment variables.
2. **Enforce configuration constraints** with no fallback defaults in the codebase.
3. **Harmonize the configuration loading** across the core application and the RAG module.
4. **Refactor Gemini API invocations** to use the settings variables dynamically.

---

## 1. Current Codebase References

### A. Hardcoded LLM Models (`gemini-2.5-flash`)
The string `"gemini-2.5-flash"` is hardcoded in the following locations, constructing the direct API request URL:

| File Path | Line Number(s) | Verbatim Code Reference |
| :--- | :--- | :--- |
| `backend/app/rag/llm.py` | 297-298 | `# Use gemini-2.5-flash as the latest standard for fast tasks`<br>`self.url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"` |
| `backend/app/rag/parser.py` | 71 | `f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"` |
| `backend/app/routers/chat.py` | 30 | `f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"` |
| `backend/app/routers/insights.py` | 55 | `f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"` |
| `backend/app/routers/jobs.py` | 223 | `f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"` |
| `backend/app/routers/resumes.py` | 187 | `f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"` |

### B. Hardcoded Embedding Models (`text-embedding-004`)
The string `"text-embedding-004"` is hardcoded in the RAG embedding module:

| File Path | Line Number(s) | Verbatim Code Reference |
| :--- | :--- | :--- |
| `backend/app/rag/embeddings.py` | 58 | `self.url = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents"` |
| `backend/app/rag/embeddings.py` | 75 | `"model": "models/text-embedding-004"` |

### C. Inconsistent API Key & Config References
The backend uses two separate settings structures:
1. **Core Settings** (`app/core/config.py`): Populated from `.env` using Pydantic. No prefix.
2. **RAG Settings** (`app/rag/config.py`): Populated from `.env` using Pydantic with prefix `RESUME_RAG_`.

The loading of the `GEMINI_API_KEY` varies across the files:

- **RAG Module (`embeddings.py`, `llm.py`)**:
  `api_key = settings.gemini_api_key or os.environ.get("GEMINI_API_KEY")` (where `settings` is RAG settings)
- **Parser (`parser.py`) / Chat (`chat.py`) / Resumes (`resumes.py`)**:
  `api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")` (where `settings` is Core settings)
- **Insights Router (`insights.py`)**:
  On line 30: `api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")`
  On line 41 (overwritten): `api_key = os.environ.get("GEMINI_API_KEY")`
- **Jobs Router (`jobs.py`)**:
  On line 209: `api_key = os.environ.get("GEMINI_API_KEY")` (bypasses `settings` completely)

---

## 2. Centralization Strategy

To resolve the above issues, we recommend the following strategy:

### Step 1: Update Environment Variables (`.env` and `.env.example`)
Add the new environment variables and remove stale keys (such as `EMBEDDING_MODEL_NAME=gemini-embedding-2` which is not used by code).

**`.env.example`**
```ini
# Gemini Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBED_MODEL=text-embedding-004
```

**`.env`**
```ini
# Gemini Configuration
GEMINI_API_KEY=AQ.Ab8RN...
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBED_MODEL=text-embedding-004
```

### Step 2: Centralize Configuration in `app/core/config.py`
Add `GEMINI_MODEL` and `GEMINI_EMBED_MODEL` to the core settings class. By defining them as types without defaults, Pydantic will enforce that they must be defined in the `.env` file or environment.

```python
class Settings(BaseSettings):
    # ... other config ...

    # Gemini Configuration (required, no stale fallback defaults)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str
    GEMINI_EMBED_MODEL: str
```

### Step 3: Centralize Configuration in `app/rag/config.py`
Since `app/rag/config.py` uses the prefix `RESUME_RAG_`, we use Pydantic's `Field(validation_alias=...)` to direct Pydantic to read `GEMINI_MODEL` and `GEMINI_EMBED_MODEL` environment variables directly, bypassing the prefix.

```python
from pydantic import Field

class Settings(BaseSettings):
    # ... other config ...

    gemini_api_key: str | None = None
    
    # Gemini models aliased to bypass the RESUME_RAG_ prefix
    gemini_model: str = Field(validation_alias="GEMINI_MODEL")
    gemini_embed_model: str = Field(validation_alias="GEMINI_EMBED_MODEL")
```

### Step 4: Refactor `app/rag/llm.py`
Pass the model dynamically to `GeminiAnswerGenerator` and load it from settings in `build_answer_generator`.

```python
# app/rag/llm.py
class GeminiAnswerGenerator(AnswerGenerator):
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
        self.headers = {
            "Content-Type": "application/json",
            "X-goog-api-key": self.api_key
        }

def build_answer_generator(settings: Settings) -> AnswerGenerator:
    if settings.llm_provider == "gemini":
        api_key = settings.gemini_api_key or os.environ.get("GEMINI_API_KEY")
        model = settings.gemini_model
        if api_key:
            return GeminiAnswerGenerator(api_key, model)
        else:
            logger.warning("GEMINI_API_KEY is not set. Falling back to LocalExtractiveGenerator.")
```

### Step 5: Refactor `app/rag/embeddings.py`
Pass the embedding model dynamically to `GeminiEmbeddingModel` and load it in `build_embedding_model`.

```python
# app/rag/embeddings.py
class GeminiEmbeddingModel(EmbeddingModel):
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:batchEmbedContents"

    def embed(self, texts: list[str]) -> list[list[float]]:
        # ...
        payload = {
            "requests": [
                {
                    "model": f"models/{self.model}",
                    "content": {"parts": [{"text": text}]}
                }
                for text in batch_texts
            ]
        }
        # ...

def build_embedding_model(settings: Settings) -> EmbeddingModel:
    if settings.embedding_provider == "gemini":
        api_key = settings.gemini_api_key or os.environ.get("GEMINI_API_KEY")
        model = settings.gemini_embed_model
        if not api_key:
            return LocalHashEmbedding()
        return GeminiEmbeddingModel(api_key, model)
```

### Step 6: Refactor Router Files & Parser
Replace hardcoded `"gemini-2.5-flash"` URLs with settings-defined URLs and standardize API key retrieval:

1. **`app/rag/parser.py`**
   ```python
   api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
   model = settings.GEMINI_MODEL
   # ...
   resp = await client.post(
       f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
   )
   ```

2. **`app/routers/chat.py`**
   ```python
   api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
   model = settings.GEMINI_MODEL
   # ...
   resp = await client.post(
       f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
   )
   ```

3. **`app/routers/insights.py`**
   Ensure we load the API key consistently from settings and use the model variable:
   ```python
   api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
   model = settings.GEMINI_MODEL
   if not api_key:
       raise HTTPException(status_code=500, detail="Gemini API Key missing")
   # ...
   resp = await client.post(
       f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
   )
   ```

4. **`app/routers/jobs.py`**
   Load key and model from settings instead of `os.environ` only:
   ```python
   api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
   model = settings.GEMINI_MODEL
   if not api_key or not model:
       return [JobWithCompanyResponse.model_validate(j) for j in jobs[:3]] # Fallback
   # ...
   resp = await client.post(
       f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
   )
   ```

5. **`app/routers/resumes.py`**
   ```python
   api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
   model = settings.GEMINI_MODEL
   if (hf_token or api_key) and model:
       # ...
       resp = await client.post(
           f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
       )
   ```

---

## 3. Verification Plan
To verify the implementation of this strategy, we can use the following test process:
1. **Pydantic Validation Check**: Try starting the application without setting `GEMINI_MODEL` or `GEMINI_EMBED_MODEL` in `.env`. The application must fail immediately with a validation error during config initialization.
2. **Env Variable Check**: Configure `.env` with a dummy model value (e.g., `GEMINI_MODEL=invalid-model-name`). Trigger an LLM-reliant API endpoint (e.g., `/chat`). Verify that the request fails with a 500 error containing `invalid-model-name` in the URL or error message.
3. **Unit Tests / Integration Tests**: Execute existing unit tests:
   ```bash
   pytest tests/
   ```
   Ensure no tests break and settings initialization works correctly.
