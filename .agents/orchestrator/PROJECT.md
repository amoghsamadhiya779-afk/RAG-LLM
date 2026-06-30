# Project: DevBoard (AI-Native Job Board)

## Architecture
DevBoard is structured as a monorepo consisting of:
- **Frontend**: A React/Vite application built with Tailwind CSS, Radix UI, TanStack Router/Start.
- **Backend**: A FastAPI backend application powered by PostgreSQL (with `pgvector` for semantic RAG operations) and Redis (supporting Celery or RQ background tasks for parsing/embedding resumes).
- **RAG Core**: Reuses and extends `src/resume_rag` as a semantic search and resume matching engine.

### Data Flow
1. **User Sign Up / Sign In**: Handled via JWT. Auth endpoints return user and profile models + a JWT token.
2. **Resume Parsing & Matching**:
   - Resume is uploaded as multipart/form-data to `/resumes`.
   - Client triggers `/resumes/:id/parse` which enqueues a background job in Redis (Celery/RQ).
   - The worker runs the resume RAG pipeline to extract skills, experience, and education, storing them in the database.
   - Embeddings are generated and saved using pgvector.
3. **Semantic Search & Recommendations**:
   - `/jobs/search?q=...` uses pgvector to find similar jobs using lexical (matching text) and semantic (embedding distance) techniques.
   - `/jobs/recommended?resumeId=...` retrieves the parsed skills from the database, compares resume embeddings with job embeddings, and returns recommended jobs.

---

## Code Layout
```
/ (Project Root)
├── frontend/                     # React/Vite Frontend
│   ├── src/
│   │   ├── components/           # UI components
│   │   ├── hooks/                # React hooks
│   │   ├── routes/               # File-based routes
│   │   ├── services/             # API clients (real & mock fallback)
│   │   └── types/                # Typescript types
│   ├── public/                   # Public assets
│   ├── package.json              # Frontend dependencies
│   ├── vite.config.ts            # Vite configuration
│   └── tsconfig.json             # TypeScript configuration
├── backend/                      # FastAPI Backend
│   ├── app/
│   │   ├── api/                  # API router definitions
│   │   ├── core/                 # Config, security, DB connections
│   │   ├── db/                   # DB session, migrations (Alembic)
│   │   ├── models/               # SQLAlchemy Models
│   │   ├── schemas/              # Pydantic Schemas
│   │   ├── services/             # Auth, Search, Matching business logic
│   │   ├── workers/              # Celery/RQ tasks for resume parsing
│   │   └── rag/                  # Resume RAG module integration
│   ├── tests/                    # Backend Pytest suite
│   ├── requirements.txt          # Python dependencies
│   ├── pyproject.toml            # Backend lint/format config
│   └── alembic.ini               # Alembic configuration
├── docker-compose.yml            # Local container configuration
├── README.md                     # Monorepo documentation
└── .github/workflows/ci.yml      # CI pipeline
```

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M1 | Monorepo Reorg | Move Vite frontend into `frontend/`, adjust configs and test builds. | None | DONE |
| M2 | Backend DB & Models | Set up database connections, models, pgvector, Alembic migrations, and seeds. | None | PLANNED |
| M3 | Backend API & RAG | Implement API contract, JWT auth, background processing, semantic search, and recommendations. | M2 | PLANNED |
| M4 | Frontend Integration | Update frontend API service to call real backend endpoints. | M1, M3 | PLANNED |
| M5 | Quality Assurance | Write Pytest, Vitest, and Playwright tests; run static checks. | M4 | PLANNED |
| M6 | DevOps & CI/CD | Set up docker-compose.yml and local GitHub Actions CI tests. | M3, M4 | PLANNED |
| M7 | Cleanup & Polish | Polish docs and remove all agent/bot files (descaffolding). | M5, M6 | PLANNED |

---

## Interface Contracts

### Frontend ↔ Backend API
- Base URL: `VITE_API_URL` (local: `http://localhost:8000`)
- Auth Header: `Authorization: Bearer <token>`
- JSON payload requests and responses (unless file uploads/multipart).
- API Routes map 1-to-1 with the `API_CONTRACT.md`.
