# Handoff Report — Explorer 1 (Milestone 1)

## 1. Observation
We searched the backend codebase using grep search. The following hardcoded Gemini model strings were observed:

- **`backend/app/rag/llm.py`** at line 298:
  ```python
  self.url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
  ```
- **`backend/app/rag/embeddings.py`** at lines 58 & 75:
  ```python
  self.url = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents"
  ...
  "model": "models/text-embedding-004",
  ```
- **`backend/app/rag/parser.py`** at line 71:
  ```python
  f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
  ```
- **`backend/app/routers/chat.py`** at line 30:
  ```python
  f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
  ```
- **`backend/app/routers/insights.py`** at line 55:
  ```python
  f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
  ```
- **`backend/app/routers/jobs.py`** at line 223:
  ```python
  f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
  ```
- **`backend/app/routers/resumes.py`** at line 187:
  ```python
  f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
  ```

Additionally, two configurations exist:
- **`backend/app/core/config.py`**: Reads standard un-prefixed settings (like `GEMINI_API_KEY`).
- **`backend/app/rag/config.py`**: Reads prefixed settings with `env_prefix="RESUME_RAG_"`.

## 2. Logic Chain
1. To centralize settings and allow both the core API routers and the RAG service classes to share configuration variables `GEMINI_MODEL` and `GEMINI_EMBED_MODEL` without duplicating env definitions, we must add these settings to both configurations.
2. In `app/core/config.py`, declaring `GEMINI_MODEL` and `GEMINI_EMBED_MODEL` as `str | None = None` will fetch them directly from environment variables.
3. In `app/rag/config.py`, using `validation_alias="GEMINI_MODEL"` and `validation_alias="GEMINI_EMBED_MODEL"` allows pydantic-settings to bypass the `RESUME_RAG_` prefix and load the exact environment variable.
4. Setting the default value to `None` inside Python class definitions guarantees that no stale, hardcoded fallbacks are used if they are not defined in the environment.
5. Raising a `ValueError` (for RAG initialization) or `HTTPException` (for routers) when these variables are missing ensures they must be explicitly configured when Gemini is used.
6. Refactoring `GeminiAnswerGenerator` and `GeminiEmbeddingModel` constructors to accept the model name dynamically resolves hardcoded URL and payload model name references.

## 3. Caveats
- Hugging Face Spaces proxy (`HF_TOKEN`) is used in `parser.py` and `resumes.py` to route queries, but direct calls to Gemini APIs are used as local fallbacks. The proposed strategy updates the local fallback URLs. If HF space configuration is also supposed to use the model settings, that would depend on the implementation of the HF Space endpoint itself, which was not investigated.
- We assumed Pydantic v2 is used based on `requirements.txt` showing `pydantic>=2.7.4`.

## 4. Conclusion
We recommend introducing `GEMINI_MODEL` and `GEMINI_EMBED_MODEL` across both settings classes, parameterizing the constructors of `GeminiAnswerGenerator` and `GeminiEmbeddingModel` to dynamically receive these model names, and updating the routers/parser to construct their URL endpoints using the configured model.

## 5. Verification Method
1. **Config Verification**: Run a python interactive session or write a test script that instantiates `Settings` from both `app/core/config` and `app/rag/config` with custom `GEMINI_MODEL` and `GEMINI_EMBED_MODEL` environment variables set. Verify that they correctly populate the properties and that they default to `None` when variables are absent.
2. **Codebase Verification**: Perform a grep search for `"gemini-1.5"`, `"gemini-2.5"`, and `"text-embedding-004"` to confirm that no hardcoded model references remain in the code.
3. **Integration Verification**: Run backend tests (`pytest`) after the implementer applies the changes to ensure no syntax/import errors were introduced.
