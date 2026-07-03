# Plan - Gemini SDK Upgrade & Centralization

## Architecture & Design
The DevBoard FastAPI backend uses Gemini for three key RAG functions:
1. **Resume Parsing**: Analyzing uploaded resumes.
2. **ATS Resume-Job Matching**: Calculating match percentages and keyword coverages.
3. **Chat / Insights**: Conversational assistant and dashboard recommendations.

All these components will be migrated from making direct HTTP calls to the `v1beta` endpoint to using the official `google-genai` SDK.

## Milestones

### Milestone 1: Centralize Gemini Configuration
- **Objective**: Define `GEMINI_MODEL` and `GEMINI_EMBED_MODEL` in configuration files, with no default fallbacks (make them required or fail-fast if empty/missing when Gemini is enabled).
- **Files to modify**:
  - `backend/app/core/config.py`
  - `backend/app/rag/config.py`
- **Output**: Environment variables `GEMINI_MODEL` and `GEMINI_EMBED_MODEL` loaded via Pydantic settings.

### Milestone 2: Upgrade to Official SDK & requirements.txt
- **Objective**: Add `google-genai` to `backend/requirements.txt`. Replace the raw `v1beta` REST API client with a helper/service that initializes the `google-genai` SDK client.
- **Files to modify**:
  - `backend/requirements.txt`
  - Create a new central client provider/service (e.g. `backend/app/core/gemini_client.py` or similar).
  - Update `backend/app/rag/embeddings.py` (replace raw HTTP embedding calls with the new SDK client).
  - Update `backend/app/rag/llm.py` (replace `v1beta` HTTP calls with the new SDK client).
  - Update `backend/app/rag/parser.py`, `backend/app/routers/chat.py`, `backend/app/routers/insights.py`, `backend/app/routers/jobs.py`, and `backend/app/routers/resumes.py`.

### Milestone 3: Startup Verification
- **Objective**: In the FastAPI startup lifecycle, initialize the Gemini client, call `ListModels` (or the equivalent SDK call `client.models.list()`), and assert that the configured `GEMINI_MODEL` is present and active. If not found or if configuration fails, fail-fast and stop the application.
- **Files to modify**:
  - `backend/app/main.py`
- **Output**: Logs showing verification success or crash if verification fails.

### Milestone 4: Health Check Endpoint `/health/gemini`
- **Objective**: Implement `/health/gemini` that uses the new SDK client to ping Gemini (e.g. call standard check or metadata retrieve) and return `{ "status": "healthy", "model": "<model_id>" }`.
- **Files to modify**:
  - Create or edit a health router, or append to `backend/app/main.py` / `backend/app/api/...`. Let's verify existing routers structure first.

### Milestone 5: Verification & Quality Assurance
- **Objective**: Write/run unit and integration tests verifying the health check endpoint, configuration verification, and RAG execution (using mocks if necessary). Ensure no hardcoded `gemini-` strings exist.
