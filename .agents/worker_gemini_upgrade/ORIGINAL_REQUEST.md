## 2026-07-01T02:39:48+05:30
You are the Worker. Your task is to perform the Milestone 1 remediation for the backend project at C:\Users\Lenovo\Desktop\RAG & LLM\backend based on the audit failure, reviewer findings, and challenger findings.

Implement the following fixes:

1. Centralize Model Configurations (R1 Remediation)
- In `backend/app/core/config.py`, change:
  GEMINI_MODEL: str = "gemini-2.5-flash"
  GEMINI_EMBED_MODEL: str = "text-embedding-004"
- Remove all local/inline fallbacks (e.g. `or "gemini-2.5-flash"` and `or "text-embedding-004"`) from ALL files, including:
  - `backend/app/main.py`
  - `backend/app/rag/llm.py`
  - `backend/app/rag/embeddings.py`
  - `backend/app/rag/parser.py`
  - `backend/app/routers/chat.py`
  - `backend/app/routers/insights.py`
  - `backend/app/routers/jobs.py`
  - `backend/app/routers/resumes.py`
- Callers must strictly rely on `settings.GEMINI_MODEL` and `settings.GEMINI_EMBED_MODEL`.
- In `llm.py` and `embeddings.py` (which use two settings classes), resolve using: `settings.GEMINI_MODEL or core_settings.GEMINI_MODEL` (no hardcoded string literal fallbacks).

2. Centralize SDK Client Initialization (Avoid socket/connection pool leaks)
- Create a new central file `backend/app/core/gemini_client.py` (or define inside app/core/config.py or app/core/gemini.py). It should expose a cached or singleton client instance (e.g. using `lru_cache` or a global client variable initialized once). E.g.:
  ```python
  from google import genai
  from app.core.config import settings
  import os

  _client = None

  def get_gemini_client() -> genai.Client:
      global _client
      if _client is None:
          api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
          _client = genai.Client(api_key=api_key)
      return _client
  ```
- Update all routers, `parser.py`, `llm.py`, `embeddings.py`, and `main.py` to import and use this centralized client helper instead of constructing `genai.Client(...)` on every request.

3. Fix Facade Streaming (Integrity Violation Fix)
- In `backend/app/rag/llm.py`, refactor `GeminiAnswerGenerator.answer_stream` to use true streaming via the official SDK:
  ```python
  def answer_stream(self, question: str, contexts: list[SearchResult]) -> Iterator[str]:
      prompt = self._build_prompt(question, contexts)
      # Import types for configuration if needed
      from google.genai import types
      config = types.GenerateContentConfig() # configure system instruction if needed
      # Use synchronous content streaming
      response_stream = self.client.models.generate_content_stream(
          model=self.model,
          contents=prompt,
          config=config
      )
      for chunk in response_stream:
          if chunk.text:
              yield chunk.text
  ```
  Ensure it does NOT split a full answer by whitespace (remove the fake streaming logic).

4. Avoid Blocking Calls in Async Route & Lifespan
- In `backend/app/main.py` GET `/health/gemini` endpoint, use the async client's list method:
  `models_list = await client.aio.models.list()`
  to avoid blocking the FastAPI event loop.
- Make sure to verify that the configured `settings.GEMINI_MODEL` (e.g. `gemini-2.5-flash`) or its normalized form is present in the list returned by the SDK.
- Update the startup verification lifespan handler to also call `await client.aio.models.list()`.

5. Mock Serper key in test suite
- In `backend/tests/test_pipeline.py::test_internet_search` or inside conftest, ensure `SERPER_API_KEY` is mocked/set so the test doesn't fail due to a missing environment variable.

6. Verify Changes
- Run pytest tests to ensure all tests pass successfully.
- Write a handoff report detailing all files modified and test results, saved to C:\Users\Lenovo\Desktop\RAG & LLM\.agents\worker_gemini_upgrade\handoff.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
