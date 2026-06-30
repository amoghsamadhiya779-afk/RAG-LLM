# Scope: Milestone 2 — Backend DB & Models

## Architecture
- Database: PostgreSQL (with pgvector)
- Database session: `backend/app/db/session.py` and `backend/app/db/base.py`
- SQLAlchemy models: `backend/app/models/models.py`
- Pydantic schemas: `backend/app/schemas/schemas.py`
- Alembic configurations: `backend/alembic.ini` and migrations under `backend/alembic/`
- Database seeds: `backend/app/db/seeds.py` or similar

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M2.1 | Model Verification | Check and ensure that all SQLAlchemy models in `backend/app/models/models.py` align with requirements and database design. | None | PLANNED |
| M2.2 | Pydantic Schemas | Create or complete Pydantic schemas in `backend/app/schemas/schemas.py` that map 1-to-1 with response/request shapes in `API_CONTRACT.md`. | M2.1 | PLANNED |
| M2.3 | Alembic Migrations | Set up Alembic configuration in `backend/alembic.ini` and create the initial migration script. Apply migrations to the local database. | M2.2 | PLANNED |
| M2.4 | Database Seeds | Write seed scripts (e.g. `seeds.py`) that populate the database with realistic sample users (seeker, employer, admin), companies, and jobs. | M2.3 | PLANNED |
| M2.5 | Verification | Verify database connections, schema constraints, and seeds using unit tests. | M2.4 | PLANNED |

## Interface Contracts
- Pydantic models must match request/response formats in `API_CONTRACT.md` exactly.
- All SQLAlchemy models must map cleanly to Pydantic schemas.
