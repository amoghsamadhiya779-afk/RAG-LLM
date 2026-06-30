# Scope: Milestone 2 — Backend DB, Models, and Setup

## Architecture
- **SQLAlchemy Models**: DB models in `backend/app/models/models.py`. Standard PostgreSQL types, `pgvector` for Job embeddings and Resume embeddings (both 1536 dimensions as per settings).
- **Alembic Migrations**: Alembic configuration in `backend/alembic.ini` (or `backend/app/db/` if we run from `backend/` directory) to manage schema versions. Needs to support the `vector` extension.
- **Pydantic Schemas**: API schemas in `backend/app/schemas/schemas.py` mirroring frontend TypeScript interfaces.
- **Database Seeding**: A Python script `backend/app/db/seed.py` that populates the database with users, profiles, companies, jobs, applications, and saved jobs matching the mock seed data.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M2.1 | Initialize Alembic | Setup alembic configuration and create initial migration that enables `vector` extension and creates all tables. | None | PLANNED |
| M2.2 | SQLAlchemy Models & Schemas | Verify and refine SQLAlchemy models and Pydantic schemas to ensure 100% alignment with types in API contract. | None | PLANNED |
| M2.3 | Seed Script | Implement a robust Python seeding script utilizing mock seed data profiles. | M2.2 | PLANNED |
| M2.4 | E2E Migration & Seed Verification | Run migrations, seed the database, and verify the schema and database entries. | M2.1, M2.3 | PLANNED |

## Interface Contracts
### Database ↔ Models
- Tables: `users`, `profiles`, `companies`, `jobs`, `applications`, `resumes`, `saved_jobs`, `audit_logs`
- Vector columns: `jobs.embedding` (Vector(1536)), `resumes.embedding` (Vector(1536))
- Foreign keys:
  - `profiles.user_id` -> `users.id`
  - `companies.owner_id` -> `users.id`
  - `jobs.company_id` -> `companies.id`
  - `applications.job_id` -> `jobs.id`, `applications.user_id` -> `users.id`, `applications.resume_id` -> `resumes.id`
  - `resumes.user_id` -> `users.id`
  - `saved_jobs.user_id` -> `users.id`, `saved_jobs.job_id` -> `jobs.id`
  - `audit_logs.actor_id` -> `users.id`
