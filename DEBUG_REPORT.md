# 🛡️ SYSTEM AUDIT & DEBUG REPORT
**Generated:** 2026-07-04
**Scope:** Complete frontend (Vite/TanStack), backend (FastAPI), and deployment infrastructure analysis.

---

## 🚨 1. Prioritized Findings

### Critical (Action Required Immediately)
1. **Broken Database Credentials**: The `DATABASE_URL` fails with `'YOUR-PASSWORD' does not appear to be an IPv4 or IPv6 address`. 
   *Fix*: URL-encode your password (`@` must be `%40`) or replace the dummy text with your actual password.
2. **Invalid Resend Key**: The `RESEND_API_KEY` fails with HTTP 401 (auth). 
   *Fix*: Re-copy the key from the correct Resend team dashboard.
3. **Invalid Supabase URL**: The `SUPABASE_URL` fails with HTTP 404 when querying `/auth/v1/settings`. 
   *Fix*: Ensure it points to a valid Supabase project endpoint (e.g. `https://xyz.supabase.co`).
4. **Git Submodule Failure**: `Resume-Intelligence/` is tracked as a git submodule but has no `.gitmodules` definition, causing "Failed to fetch git submodules" warnings on every build (Vercel & HF).
   *Fix*: Run `git rm Resume-Intelligence` and commit.

### High (Security & Architecture)
1. **Privacy Leak**: The `data/uploads` directory contains uploaded resume PDFs (`Amogh_Resume_.pdf`). These files were tracked in git and remain in the git history.
   *Fix*: If this repository is public, run `git filter-repo` to permanently scrub them from history.
2. **Disjointed Reranking Logic (Backend)**: In `backend/app/api/routes/jobs.py` (~line 157), code hits `api.langsearch.com/v1/rerank` using `SERPER_API_KEY` for auth, but only if `ADZUNA_APP_KEY` is present. This is hallucinated/dead code.
   *Fix*: Delete the reranking block.

### Low (Cleanup & Maintenance)
1. **Orphaned `app/services/rag/` Module**: Recursive grep confirms `app.services.rag` is never imported anywhere in the backend codebase. 
2. **Corrupt `.gitignore`**: Line 54 contains null bytes (corrupt binary data): `.\x00b\x00i\x00n\x00/\x00\r\x00`.
3. **Legacy RAG-LLM Artifacts**: 17+ items (including `Dockerfile`, `Makefile`, `scripts/`, `tests/`) belong to a deleted python package (`resume_rag`) and are entirely stale.

---

## 🔑 2. Live Key Connectivity Check

Script executed via `backend/scripts/check_connections.py` on the live `.env`.

| SERVICE         | VARS                                     | STAT | REASON               | HINT |
|:----------------|:-----------------------------------------|:-----|:---------------------|:-----|
| Supabase        | URL=***/v1/ KEY=***-DGA                  | FAIL | HTTP 404             | Valid project URL? |
| Database        | URL=***gres                              | FAIL | auth/network         | Password not URL-encoded? |
| Gemini          | KEY=***AvOQ                              | PASS |                      | |
| HuggingFace     | TOKEN=***ERRS                            | PASS |                      | |
| Adzuna          | ID=***4bea KEY=***be02                   | PASS |                      | |
| Serper          | KEY=***7387                              | PASS |                      | |
| Upstash Redis   | URL=***h.io TOKEN=***MxOA                | PASS |                      | |
| Resend          | KEY=***AJSa                              | FAIL | auth                 | Wrong team/invalid? |
| Turnstile       | SECRET=***0SRk                           | PASS |                      | |
| Sentry          | DSN=***NONE                              | SKIP | Missing var          | |

*(Note: Never guess or substitute replacement values. Rotate or fix the failing keys at their respective dashboards.)*

---

## 🚀 3. Deploy Alignment Matrix

### Vercel / Frontend
*   **Root Directory**: `frontend`
*   **Framework Preset**: TanStack Start
*   **Install Command**: `npm install` (The `--legacy-peer-deps` override is **no longer needed**. A fresh install audited 532 packages cleanly).
*   **Output Override**: None (Vercel will auto-detect `.output/`).
*   **Env Vars (`env.ts`)**: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_TURNSTILE_SITE_KEY`, `VITE_SENTRY_DSN` (No secrets required on client. No `NEXT_PUBLIC_*` left in codebase).
*   **Leftovers**: No committed `dist/`, `.output/`, or `.next/` directories. No spoofing scripts in `package.json`.

### Hugging Face / Backend
*   **Root Directory**: `backend` (Built via standalone `Dockerfile`)
*   **Env Vars (Secrets)**: `DATABASE_URL`, `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `CRON_SECRET`.
*   **Hardcoded Defaults**: `ADZUNA_API_URL`, `SERPER_API_URL`, `LANGSEARCH_API_URL`, `TURNSTILE_API_URL`, `RESEND_API_URL` are safely defaulted in `config.py` and do not need to be set on HF.
*   **Docker Note**: Docker daemon was unavailable locally. Verified via venv-equivalent (`uvicorn` start test), which successfully handled config loading and Gemini graceful degradation. Final proof will be the HF build log on the next push.

---

## 🗑️ 4. Census Verdicts & Stale Candidates

The original monolithic RAG-LLM project source (`src/resume_rag/`) was deleted, but its tests, config, data, scripts, and Docker files remained. **These items are marked stale and await user approval for deletion:**

| Path | What it is | Verdict |
|------|-----------|---------|
| `.bin/` | Vendored Node.js runtime | Stale — propose removal |
| `.env` (root) | Legacy env file | Stale — propose removal |
| `.ruff_cache/` | Ruff linter cache | Stale — propose removal |
| `backend/docker_run.log` | Stale log | Stale — propose removal |
| `check-error.js` | Puppeteer debug script | Stale — propose removal |
| `data/` | Old vector stores, PDFs, logs | Stale — propose removal |
| `docker-compose.yml` | Legacy compose | Stale — propose removal |
| `Dockerfile` (root) | Legacy (duplicates backend/) | Stale — propose removal |
| `dummy.txt` | Test file | Stale — propose removal |
| `frontend/.wrangler/` | CF deploy config | Stale — propose removal |
| `frontend/bun.lock` | Bun lockfile | Stale — propose removal |
| `frontend/bunfig.toml` | Bun config | Stale — propose removal |
| `frontend/fix_imports.py` | One-off script | Stale — propose removal |
| `frontend/tsconfig.tsbuildinfo`| Build cache | Stale — propose removal |
| `Makefile` | Legacy | Stale — propose removal |
| `patch.cjs` (root) | Duplicate patch script | Stale — propose removal |
| `pyproject.toml` | Legacy package | Stale — propose removal |
| `pytest_temp/` | Tracked test temp artifacts | Stale — propose removal |
| `Resume-Intelligence/` | Broken git submodule | Stale — propose removal |
| `scripts/` | Legacy demo scripts | Stale — propose removal |
| `tests/` (root) | Legacy tests | Stale — propose removal |
| `backend/app/services/rag/` | Orphaned backend module | Stale — propose removal |
