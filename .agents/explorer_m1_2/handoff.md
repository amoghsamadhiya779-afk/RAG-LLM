# Handoff Report - Centralizing Gemini Configuration (Milestone 1)

## 1. Observation
We ran filesystem searches for the string `"gemini"` in the backend directory.
We observed the following direct code references:

- **`backend/app/rag/llm.py`**
  - Line 297-298:
    ```python
    # Use gemini-2.5-flash as the latest standard for fast tasks
    self.url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
    ```
- **`backend/app/rag/parser.py`**
  - Line 71:
    ```python
    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
    ```
- **`backend/app/routers/chat.py`**
  - Line 30:
    ```python
    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
    ```
- **`backend/app/routers/insights.py`**
  - Line 55:
    ```python
    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
    ```
- **`backend/app/routers/jobs.py`**
  - Line 223:
    ```python
    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
    ```
- **`backend/app/routers/resumes.py`**
  - Line 187:
    ```python
    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
    ```
- **`backend/app/rag/embeddings.py`**
  - Line 58:
    ```python
    self.url = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents"
    ```
  - Line 75:
    ```python
    "model": "models/text-embedding-004",
    ```

We also observed the configuration structures in:
- **`backend/app/core/config.py`**: A Pydantic `BaseSettings` subclass loaded from `.env` without a prefix, defining `GEMINI_API_KEY: str = ""`.
- **`backend/app/rag/config.py`**: A Pydantic `BaseSettings` subclass loaded from `.env` with the prefix `RESUME_RAG_`, defining `gemini_api_key: str | None = None`.
- **`backend/.env.example`** & **`backend/.env`**: Define `GEMINI_API_KEY` but do not define any variables for the Gemini model or embedding model names.
- **Inconsistent key resolution** in routers:
  - `insights.py` line 41 overwrites the settings API key with `api_key = os.environ.get("GEMINI_API_KEY")`.
  - `jobs.py` line 209 bypasses settings completely with `api_key = os.environ.get("GEMINI_API_KEY")`.

---

## 2. Logic Chain
1. **Remove Hardcoded Model Strings**: The hardcoded model strings (`gemini-2.5-flash` and `text-embedding-004`) reside in multiple files across `app/rag/` and `app/routers/`. Refactoring these files to construct their endpoints using dynamic model strings requires that we pass or inject the model names at runtime.
2. **Centralize into Config**: Defining these models in Pydantic settings classes (`app/core/config.py` and `app/rag/config.py`) will allow the application to read them from environment variables (`GEMINI_MODEL` and `GEMINI_EMBED_MODEL`).
3. **Prevent Fallbacks**: In order to satisfy the requirement of "no stale fallback defaults," we must declare these configuration variables in Pydantic settings without any default values. This ensures that Pydantic will raise a `ValidationError` at startup if the environment variables are not supplied in `.env` or the shell environment.
4. **Coordinate Dual Settings Classes**: Because the RAG settings module loads environment variables with the `RESUME_RAG_` prefix, we must use `Field(validation_alias="GEMINI_MODEL")` and `Field(validation_alias="GEMINI_EMBED_MODEL")` to explicitly bind the settings fields to the shared, global environment variables `GEMINI_MODEL` and `GEMINI_EMBED_MODEL`.
5. **Clean Inconsistencies**: The inconsistent resolution of `GEMINI_API_KEY` (directly via `os.environ` or settings) should be replaced with `settings.GEMINI_API_KEY` to enforce configuration alignment.

---

## 3. Caveats
- **Dual Config Classes**: This backend has two settings systems (`app.core.config.settings` and `app.rag.config.Settings`). When refactoring, both settings classes must be updated so that all parts of the application (direct routers and the RAG module) retrieve the same configuration values.
- **Other Providers**: The RAG module allows using `"openai"` or `"local"` providers. If `GEMINI_MODEL` and `GEMINI_EMBED_MODEL` are made strict required fields on the Pydantic classes, the application will not boot without them even if a user intends to run exclusively on OpenAI. If this behavior is undesired, the fields can be declared as `str | None = None` and validated manually inside `build_answer_generator` and `build_embedding_model` when the selected provider is `"gemini"`. However, if they are required overall, adding them to `.env` is necessary.

---

## 4. Conclusion
We recommend:
- Adding `GEMINI_MODEL` and `GEMINI_EMBED_MODEL` environment variables to `.env` and `.env.example`.
- Adding them to `app/core/config.py` as required `str` properties.
- Adding them to `app/rag/config.py` with Pydantic's `Field(validation_alias=...)` to map them directly to the non-prefixed environment variables.
- Modifying `app/rag/embeddings.py` and `app/rag/llm.py` to accept the model parameter on class instantiation.
- Standardizing key and model resolution in `app/rag/parser.py` and the router files (`chat.py`, `insights.py`, `jobs.py`, `resumes.py`).

---

## 5. Verification Method
- **Startup Validation Test**:
  1. Comment out `GEMINI_MODEL` and `GEMINI_EMBED_MODEL` from `.env`.
  2. Run the application (e.g. `uvicorn app.main:app` or via python run script).
  3. Verify that the application fails to start and outputs a validation error indicating missing config fields.
- **Integration/Unit Test Suite**:
  Run backend unit tests to ensure configuration loads correctly and doesn't break existing mock/local tests:
  ```bash
  pytest
  ```
