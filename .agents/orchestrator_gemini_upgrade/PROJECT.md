# Project: Gemini SDK Upgrade & Centralization

## Architecture
- FastAPI backend communicating with Google Gemini API.
- Replaces raw REST calls (`v1beta`) with `google-genai` SDK.
- Centralizes model settings via `GEMINI_MODEL` and `GEMINI_EMBED_MODEL` environment variables.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M1 | Centralize Gemini Configuration | Move model references to environment variables `GEMINI_MODEL` and `GEMINI_EMBED_MODEL` in core/rag configs. | None | PLANNED |
| M2 | Upgrade to Official SDK | Install `google-genai` and refactor all API calls to use the SDK. | M1 | PLANNED |
| M3 | Startup Verification | Verify model presence using `ListModels` on app startup. | M2 | PLANNED |
| M4 | Health Check Endpoint | Implement `/health/gemini` endpoint returning verification details. | M3 | PLANNED |
| M5 | Verification & QA | Run and verify tests, ensuring all requirements are met. | M4 | PLANNED |

## Interface Contracts
### Health Check
- GET `/health/gemini` -> Response: `{"status": "healthy", "model": "<model_id>"}` (returns 200 OK)
