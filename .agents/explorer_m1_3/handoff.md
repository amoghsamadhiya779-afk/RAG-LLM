# Handoff Report - Explorer 3

## 1. Observation
The following references to hardcoded Gemini models and configurations were observed in the codebase:
- In `backend/app/rag/llm.py` line 298:
  ```python
  self.url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
  ```
- In `backend/app/rag/parser.py` line 71:
  ```python
  f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
  ```
- In `backend/app/routers/chat.py` line 30:
  ```python
  f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
  ```
- In `backend/app/routers/insights.py` line 55:
  ```python
  f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
  ```
- In `backend/app/routers/jobs.py` line 223:
  ```python
  f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
  ```
- In `backend/app/routers/resumes.py` line 187:
  ```python
  f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
  ```
- In `backend/app/rag/embeddings.py` line 58:
  ```python
  self.url = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents"
  ```
- In `backend/app/rag/embeddings.py` line 75:
  ```python
  "model": "models/text-embedding-004",
  ```
- In `backend/app/core/config.py`:
  Loads settings, has `GEMINI_API_KEY`, but does not define variables for `GEMINI_MODEL` or `GEMINI_EMBED_MODEL`.
- In `backend/app/rag/config.py`:
  Uses prefix `RESUME_RAG_` for env variables, does not define `gemini_model` or `gemini_embed_model`.

## 2. Logic Chain
1. Multiple endpoints and RAG utilities make direct HTTP POST requests to the Gemini API endpoint URLs.
2. The URL paths in these calls contain hardcoded model names (`gemini-2.5-flash` and `text-embedding-004`), making them inflexible.
3. In order to centralize these configurations, we must expose `GEMINI_MODEL` and `GEMINI_EMBED_MODEL` environment variables.
4. If they are declared in `app/core/config.py` and `app/rag/config.py`, they can be dynamically read from the environment.
5. In `app/rag/config.py`, because of the prefix `RESUME_RAG_`, Pydantic's `Field(validation_alias=...)` must be used to ensure the global variables `GEMINI_MODEL` and `GEMINI_EMBED_MODEL` are parsed without prefix requirements.
6. Replacing the hardcoded strings in the request URLs with `{settings.GEMINI_MODEL}` or `{settings.GEMINI_EMBED_MODEL}` enables fully centralized configuration.
7. Requiring checks (e.g. raising a `ValueError`) if the active provider is `gemini` but the variables are not set avoids "stale fallback defaults" and enforces explicit configuration.

## 3. Caveats
- Direct HTTP requests to Google API endpoints are used instead of the official `google-generativeai` SDK. The refactoring strategy maintains this HTTP client approach rather than adding a dependency on the official SDK.
- The default value for other config variables (e.g., `EMBEDDING_MODEL_NAME=gemini-embedding-2` in `.env`) is not currently active in Python code since `text-embedding-004` is hardcoded. Once centralized, `EMBEDDING_MODEL_NAME` can be deprecated or updated.

## 4. Conclusion
Centralizing Gemini model configurations requires introducing `GEMINI_MODEL` and `GEMINI_EMBED_MODEL` to both `app/core/config.py` and `app/rag/config.py` (with appropriate Pydantic `validation_alias` mapping in the latter to bypass the prefix), and refactoring all hardcoded URLs to construct paths dynamically using these variables.

## 5. Verification Method
- Execute the backend test suite:
  ```bash
  pytest tests/test_pipeline.py
  ```
- To verify the absence of hardcoded fallbacks, perform a grep check:
  ```bash
  grep -rn "gemini-2.5-flash" backend/app/
  grep -rn "text-embedding-004" backend/app/
  ```
  Both commands should return zero matches in source code once the centralization changes are implemented.
- Delete the `GEMINI_MODEL` environment variable from `.env` and verify that the application throws a validation or runtime error (e.g., `ValueError`) when accessing Gemini services, proving that no stale fallbacks are used.
