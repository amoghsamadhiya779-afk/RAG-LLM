# Original User Request

## Initial Request — 2026-06-30T07:14:15Z

<USER_REQUEST>
# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Multi-agent teamwork execution in progress

An enterprise-grade FastAPI backend for "DevBoard" (an AI-native job board), integrated with an existing Vite/React frontend, featuring a RAG-powered semantic search and resume matching pipeline, complete with CI/CD, tests, and a polished monorepo structure.

Working directory: `C:\Users\Lenovo\Desktop\RAG & LLM`
Integrity mode: development

## Requirements

### R1. Phase 0 & 1: Monorepo Reorg & Backend Implementation
- Assess and move the existing root Vite frontend into `frontend/`.
- Build a FastAPI backend in `backend/` implementing every endpoint in `API_CONTRACT.md` exactly, using Postgres + pgvector, SQLAlchemy, Pydantic, Alembic, and Redis (RQ/Celery).
- Implement JWT auth, CRUD for jobs/companies/applications/resumes.
- Reuse and extend the existing `src/resume_rag/` pipeline as the AI core for semantic search and resume matching.

### R2. Phase 2 & 3: Frontend Integration & Quality
- Connect the frontend `src/services/api.ts` to the real backend via `VITE_API_URL`, keeping a mock fallback.
- Write backend tests (pytest), frontend tests (Vitest + React Testing Library), and a basic Playwright e2e test.
- Implement strict security (RBAC, rate limiting, validation), linting (ruff, black, eslint), and type-checking (mypy, tsc).

### R3. Phase 4 & 5: DevOps & Repo Polish
- Create `docker-compose.yml` (API, Postgres/pgvector, Redis, Frontend).
- Set up a GitHub Actions CI pipeline (lint, typecheck, test, build — no deploy).
- Polish the repo: enterprise `README.md`, `CONTRIBUTING.md`, `LICENSE`, clean monorepo structure, and clean git history (Conventional Commits).

### R4. Phase 6: Final Cleanup
- After everything is green, delete all AI-agent and bot scaffolding (`AGENTS.md`, `.cursor`, `.lovable`, `// TODO(backend)` comments, etc.) so the repo looks hand-built.

## Acceptance Criteria

### Backend & API
- [ ] Backend runs successfully via `docker compose up`.
- [ ] All endpoints in `API_CONTRACT.md` are implemented with exact matching request/response shapes.
- [ ] RAG pipeline (semantic search, resume matching) functions correctly using `pgvector`.

### Frontend & Integration
- [ ] Frontend installs, builds, and runs successfully from the new `frontend/` directory.
- [ ] Frontend correctly fetches data from the real backend when `VITE_USE_MOCKS` is disabled.
- [ ] Playwright e2e test (search → view → apply) passes.

### Quality & Polish
- [ ] Pytest, Vitest, MyPy, and ESLint suites pass with zero errors.
- [ ] GitHub Actions CI pipeline runs completely green locally (via act) or verified via scripts.
- [ ] All agent/bot files (like `AGENTS.md`) are completely removed from the final repository state.
</USER_REQUEST>

## Follow-up — 2026-06-30T19:47:15+05:30

<USER_REQUEST>
# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Single Hero Website UI Refactor

Refactor the Next.js frontend into a "Single Hero Website" to eliminate slow page loads. Extract the Jobs, Companies, and AI Workspace logic into standalone components, integrate them vertically on the homepage (`app/page.tsx`), and update the navbar (`SiteHeader`) to use smooth-scrolling anchor links.

Working directory: `C:\Users\Lenovo\Desktop\RAG & LLM\frontend`
Integrity mode: benchmark

## Requirements

### R1. Extract Sections
Extract the core functionality from `app/jobs/page.tsx`, `app/companies/page.tsx`, and `app/ai-workspace/page.tsx` into reusable React components (e.g., inside `src/components/sections/`). Once extracted, completely delete the old standalone `app/jobs/page.tsx`, `app/companies/page.tsx`, and `app/ai-workspace/page.tsx` routes.

### R2. Integrate Homepage
Assemble the extracted section components onto the main `app/page.tsx` homepage. Wrap each component in a distinctly ID'd section tag (e.g., `<section id="jobs">`). Create a seamless, continuous-scrolling "Single Hero" landing experience. 

### R3. Overhaul Navbar
Update `src/components/site/header.tsx`. Replace all conditional routing links with unified smooth-scrolling anchor tags (e.g., `href="#jobs"`, `href="#companies"`, `href="#ai-workspace"`).

### R4. Premium UI
Incorporate high-quality, modern UI components (draw inspiration from `https://21st.dev/community/components`) to ensure the Single Hero Website feels ultra-polished and production-grade.

## Acceptance Criteria

### Component Architecture
- [ ] `app/page.tsx` imports and renders the Jobs, Companies, and AI Workspace sections vertically.
- [ ] The standalone route pages (`app/jobs/page.tsx`, `app/companies/page.tsx`, `app/ai-workspace/page.tsx`) have been deleted.

### Navigation
- [ ] The `SiteHeader` component uses `#` anchor links for internal navigation instead of Next.js paths.

### Compilation
- [ ] Running `npm run build` from the `frontend/` directory completes successfully with exit code 0. No unresolved import errors from the deleted routes.
</USER_REQUEST>

