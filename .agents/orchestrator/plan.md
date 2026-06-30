# DevBoard Project Plan

This document outlines the step-by-step plan for building the enterprise-grade FastAPI backend, reorganizing the monorepo, integrating the React frontend, adding testing, and completing DevOps setup.

## Strategy: Dual-Track Orchestration
We run two tracks in parallel:
1. **Implementation Track**: Executes features milestone by milestone (Monorepo Reorg -> DB/Models -> API/Auth/RAG -> Frontend Integration -> Testing -> DevOps -> Polish).
2. **E2E Testing Track**: Builds requirement-driven E2E tests based on `ORIGINAL_REQUEST.md`. Once complete, it publishes `TEST_READY.md`.

---

## Detailed Milestones

### Milestone 1: Monorepo Reorganization
- **Goal**: Cleanly split frontend and backend workspace.
- **Tasks**:
  - Move Vite frontend (package.json, src/, public/, config files, etc.) into `frontend/` subdirectory.
  - Exclude backend/Python-related files (like `src/resume_rag`) from the frontend move, or copy/keep them in a shared or backend location.
  - Update any import path mapping in frontend.
  - Ensure the frontend installs dependencies and builds inside `frontend/` correctly.

### Milestone 2: Backend DB, Models, and Setup
- **Goal**: Set up backend infrastructure (Postgres, SQLAlchemy, migrations, schemas).
- **Tasks**:
  - Define SQLAlchemy models matching requirements (Job, Company, Application, Resume, User, Profile).
  - Use `pgvector` for job tags/description and resume matching.
  - Configure Alembic migrations for automatic schema updates.
  - Set up Pydantic schemas for request/response validation.
  - Write standard database seeds/fixtures for initial load.

### Milestone 3: Backend API, Auth, and RAG Integration
- **Goal**: Implement all REST endpoints and RAG search logic.
- **Tasks**:
  - Implement JWT authentication (sign-up, sign-in, sign-out, me) with role-based access control (RBAC).
  - Implement Jobs, Companies, Applications, Resumes, Saved Jobs, Admin, and Billing endpoints exactly per `API_CONTRACT.md`.
  - Reuse and extend `src/resume_rag/` as the AI core.
  - Set up Celery/RQ with Redis for asynchronous resume parsing and embedding generation.
  - Integrate pgvector semantic search (`/jobs/search?q=`) and recommendation (`/jobs/recommended?resumeId=`).

### Milestone 4: Frontend Integration
- **Goal**: Connect frontend to real backend API.
- **Tasks**:
  - Update `frontend/src/services/api.ts` to call real backend endpoints (replace mock functions with `fetch`).
  - Configure environment variables (`VITE_API_URL`, `VITE_USE_MOCKS`).
  - Verify UI elements render and work correctly with real API responses.

### Milestone 5: Testing and Quality Assurance
- **Goal**: Robust test coverage across layers.
- **Tasks**:
  - Write Pytest suite for backend endpoints, auth, and RAG search.
  - Write Vitest and React Testing Library tests for key frontend pages and components.
  - Run Playwright E2E tests (job search, resume upload, job application).
  - Run static analysis tools: Ruff, ESLint, MyPy, and tsc to verify zero errors.

### Milestone 6: DevOps, Docker Compose, and CI/CD
- **Goal**: Dockerization and local/remote integration.
- **Tasks**:
  - Create a root `docker-compose.yml` to spin up:
    - FastAPI API service
    - PostgreSQL with pgvector extension
    - Redis (for Celery/RQ)
    - Celery/RQ worker
    - Vite React Frontend (built or served in dev mode)
  - Configure GitHub Actions CI workflow to run linters, typecheckers, and tests automatically.

### Milestone 7: Cleanup, Polish, and De-scaffolding
- **Goal**: Make the repository look clean and hand-built.
- **Tasks**:
  - Create production-ready `README.md`, `CONTRIBUTING.md`, and `LICENSE`.
  - Perform git history cleanup.
  - Remove all bot/AI agent scaffolding (`AGENTS.md`, `.lovable/`, temp test files, and TODO comments).

---

## Verification Plan
For each milestone:
- Spawn an Explorer to recommend design/strategy.
- Spawn a Worker to perform the task.
- Spawn Reviewers to check implementation correctness.
- Spawn Challengers to write/run unit/integration tests and verify logic.
- Spawn a Forensic Auditor to ensure no hardcoding or integrity violations.
