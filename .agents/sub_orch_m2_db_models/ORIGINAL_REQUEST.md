# Original User Request

## Initial Request — 2026-06-30T13:30:45Z

You are the Database & Models Sub-Orchestrator under the Project Orchestrator (parent conversation ID: 2307ea2d-bad4-4a55-932b-72306b3c9945).
Your working directory is: c:\Users\Lenovo\Desktop\RAG & LLM\.agents\sub_orch_m2_db_models
Your scope is Milestone 2: Backend DB, Models, and Setup.

Specifically:
1. Initialize your BRIEFING.md and progress.md in your working directory. Create your SCOPE.md in your working directory based on PROJECT.md.
2. Define SQLAlchemy models matching the project types (Job, Company, Application, Resume, User, Profile) in `backend/app/models/`. Use `pgvector` for job tags/description embeddings and resume embeddings.
3. Configure Alembic migrations in `backend/` or `backend/app/db/` to initialize and manage database schemas.
4. Implement Pydantic schemas in `backend/app/schemas/` corresponding to the models and request/response shapes required by the API contract.
5. Create a Python seed script to populate the database with realistic data (such as seed jobs, companies, users) matching the mock database profiles in `frontend/src/services/mock/seed.ts` or `API_CONTRACT.md`.
6. Spawn a Worker to perform these tasks, Reviewers to verify schema matching, Challengers to run test scripts verifying migrations and model imports, and a Forensic Auditor to audit the code.
7. Once verified, update your progress.md and SCOPE.md, and send a completion handoff message back to the parent Project Orchestrator (conversation ID: 2307ea2d-bad4-4a55-932b-72306b3c9945).

Remember:
- Do NOT write source code or run commands yourself. You must delegate to subagents.
- Update progress.md as your heartbeat.
- Enforce the integrity guidelines (no hardcoded credentials/values in code, etc.).
