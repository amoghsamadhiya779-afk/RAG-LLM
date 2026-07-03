# Handoff Report — Gemini SDK Centralization Verification

## 1. Observation

### Test Execution & Centralized Components
- **Test Command & Outputs**:
  Running tests in the `backend/tests/` directory with `PYTHONPATH="backend"` initially resulted in a failure for `test_internet_search` when `SERPER_API_KEY` was missing, returning `400 Bad Request`.
  Running with `$env:SERPER_API_KEY="test-key"` resolved the failure:
  ```powershell
  $env:SERPER_API_KEY="test-key"; $env:PYTHONPATH="backend"; .venv\Scripts\pytest backend/tests
  ```
- **New Tests Added**:
  - `backend/tests/test_gemini_components.py`: Created to unit test `GeminiEmbeddingModel` and `GeminiAnswerGenerator` via mock API interfaces.
  - `backend/tests/test_pipeline.py`: Replaced the empty `test_ats_scoring` placeholder with a functional integration test that creates a temporary SQLite test database, registers a mock user and resume, and tests `/resumes/ats/score`.
  All 11 tests now pass successfully.

---

### Code Analysis & Bug Detections

#### A. Logic Regression in Query Generation (`backend/app/rag/llm.py`)
In `GeminiAnswerGenerator.generate_queries` (lines 366-373):
```python
    def generate_queries(self, question: str) -> list[str]:
        prompt = (
            "You are an AI language model assistant. Your task is to generate 3 "
            "different versions of the given user question to retrieve relevant documents from a vector "
            "database. Provide these alternative questions separated by newlines. Original question: " + question
        )
        res = self._call_gemini(prompt)
        return [q.strip() for q in res.split("\n") if q.strip()]
```
- **Discrepancy**: Unlike `OpenAIAnswerGenerator.generate_queries` (which prepends `[question]` to the generated list and falls back to `[question]` on exception), the Gemini implementation:
  1. Only returns the alternative queries (excluding the original user query).
  2. Returns an empty list `[]` if the API call fails (since `_call_gemini` returns `""`). Downstream RAG search then iterates over `[]` and retrieves 0 documents, breaking the search.

#### B. Mock User Instantiation Bug (`backend/app/core/deps.py`)
In `get_current_user` (lines 28-34):
```python
        user = User(
            id=mock_uuid,
            email="universal@project.local",
            hashed_password="mock",
            role=RoleEnum.admin,
            is_active=True
        )
```
- **Discrepancy**: In `backend/app/models/models.py`, the `User` class is defined without columns/attributes `hashed_password`, `role`, or `is_active` (they are on the `Profile` model instead, and password column is `password_hash`). If the database is empty, this function crashes with `TypeError: 'role' is an invalid keyword argument for User`.

#### C. Non-Streaming Stream Method (`backend/app/rag/llm.py`)
In `GeminiAnswerGenerator.answer_stream` (lines 327-332):
```python
    def answer_stream(self, question: str, contexts: list[SearchResult]) -> Iterator[str]:
        full_answer = self.answer(question, contexts)
        words = full_answer.split(" ")
        for i, word in enumerate(words):
            yield (word + " ") if i < len(words) - 1 else word
```
- **Discrepancy**: The method waits for the full blocking response from Gemini, then splits and yields it word-by-word. It does not use true streaming (`client.models.generate_content_stream`), impacting the user experience.

#### D. Missing Error Handling in Embeddings (`backend/app/rag/embeddings.py`)
In `GeminiEmbeddingModel.embed` (lines 54-72), the Gemini client is called directly without a `try/except` block. Any network issue or API key expiration will crash the entire RAG ingestion/retrieval pipeline.

#### E. Broken Legacy Root Tests (`tests/`)
Root-level unit tests (`test_api.py`, `test_chunking.py`, `test_rag_service.py`, `test_vector_store.py`) are broken because they try to import `resume_rag`, which is empty since the module was refactored and moved to `backend/app/rag/` during Milestone 1.

---

## 2. Logic Chain

1. **Test Verification**: Running pytest directly exposed the dependency of `test_internet_search` on `SERPER_API_KEY`, which defaults to empty in configuration. Providing a dummy value allowed it to pass.
2. **Missing Coverage**: The `/ats/score` endpoint was completely untested (placeholder with `pass`). Writing an integration test required overriding `get_db` and seeding a mock user and resume.
3. **Database Insertion Error**: Attempting to insert a mock `User` with `role=RoleEnum.admin` in the test database generated a `TypeError`. Checking `models.py` confirmed `User` only holds `id`, `email`, `password_hash`, and `created_at`, while `Profile` holds the `role`. Comparing this to `deps.py`'s `get_current_user` constructor logic revealed it will crash whenever it needs to create the universal mock user.
4. **Behavior Discrepancy**: Tracing `generate_queries` showed that a Gemini API failure returns `[]` instead of `[question]`, causing fused results to be empty. Moreover, the original question is left out of the search queries, leading to sub-optimal retrieval results.
5. **Streaming/Exceptions**: Inspecting `GeminiAnswerGenerator.answer_stream` showed synchronous generation. Inspecting `GeminiEmbeddingModel.embed` showed zero exception wrappers.

---

## 3. Caveats

- We mock the `google.genai.Client` in all component and integration tests to ensure that tests can run offline and without requiring a live `GEMINI_API_KEY`.
- The root-level tests under `tests/` were not modified, as the user requested to analyze and run the tests in `backend/tests/`. However, they remain broken.

---

## 4. Conclusion

- **Overall correctness**: The centralization of Gemini configurations into the FastAPI lifespan and core config is correctly structured and works under standard mock environments.
- **Actionable Findings**:
  1. **Fix `generate_queries` in `backend/app/rag/llm.py`**: Change it to prepend the original question and gracefully fall back to `[question]` on failure, mirroring the OpenAI generator logic.
  2. **Fix `get_current_user` in `backend/app/core/deps.py`**: Update `User` construction to remove `hashed_password` (use `password_hash`), `role`, and `is_active` so it does not crash when the database is empty.
  3. **Add error handling to `GeminiEmbeddingModel.embed`**: Wrap the call in a `try/except` block with a local fallback or logging to avoid crashing.
  4. **Implement true streaming in `answer_stream`**: Upgrade to use `client.models.generate_content_stream`.
  5. **Deprecate or update root-level legacy tests**: Refactor imports to point to `app.rag.*` or remove the broken files in the root `tests/` directory.

---

## 5. Verification Method

To verify the test suite:
1. Set the PYTHONPATH and SERPER_API_KEY environment variables, then run the pytest command on `backend/tests`:
   ```powershell
   $env:SERPER_API_KEY="test-key"; $env:PYTHONPATH="backend"; .venv\Scripts\pytest backend/tests
   ```
2. Verify that all 11 tests (including the new component tests and the integration test for `/ats/score`) run and pass successfully.
