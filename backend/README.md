---
title: Resume Intelligence API
emoji: 🚀
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# jOBiON Backend API

FastAPI backend for jOBiON — deployed on Hugging Face Spaces (Docker).

## Live Endpoints

| Endpoint | Description |
|---|---|
| `GET /health` | Liveness probe |
| `GET /health/gemini` | Gemini model availability check |
| `GET /ready` | Readiness probe |
| `GET /api/v1/jobs` | Paginated job list (`limit`, `offset`, `q`, `remote`, `tag`) |
| `POST /api/v1/resumes/upload` | Upload PDF resume |
| `POST /api/v1/resumes/{id}/analyze` | AI resume analysis (Gemini 2.5 Flash) |
| `POST /api/v1/ats/score` | ATS keyword match score vs job description |
| `POST /api/v1/chat` | Career coach chat (RAG) |
| `GET /api/v1/insights` | Career trend insights |

## Local Dev

```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env  # fill in your keys
uvicorn app.main:app --reload --port 8000
```

API docs available at http://localhost:8000/docs

## Environment Variables

See `.env.example` for the full list. Required:
- `GEMINI_API_KEY` — Google AI Studio key
- `DATABASE_URL` — PostgreSQL connection string (asyncpg)
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- `ADZUNA_APP_ID` + `ADZUNA_APP_KEY` — job feed
