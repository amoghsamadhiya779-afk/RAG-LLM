---
title: jOBiON
emoji: 🚀
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

<div align="center">

# jOBiON — AI-Native Tech Job Board

**Career intelligence for the modern engineer.**  
Real-time job aggregation · Gemini-powered resume analysis · ATS scoring · RAG career coach

[![Backend](https://img.shields.io/badge/API-Hugging%20Face%20Spaces-orange?logo=huggingface)](https://1amogh212-resume-intelligence.hf.space/health)
[![Gemini](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-blue?logo=google)](https://1amogh212-resume-intelligence.hf.space/health/gemini)
[![Stack](https://img.shields.io/badge/Stack-FastAPI%20%2B%20TanStack%20Start-green)](https://github.com/amoghsamadhiya779-afk/RAG-LLM)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](LICENSE)

</div>

---

## Live Services

| Service | URL | Status |
|---|---|---|
| **Backend API** | `https://1amogh212-resume-intelligence.hf.space` | [![health](https://img.shields.io/badge/dynamic/json?url=https://1amogh212-resume-intelligence.hf.space/health&query=status&label=health)](https://1amogh212-resume-intelligence.hf.space/health) |
| **API Docs** | `https://1amogh212-resume-intelligence.hf.space/docs` | Swagger UI |
| **Gemini Health** | `/health/gemini` → `gemini-2.5-flash` | ✅ |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                     │
│   TanStack Start (React 19 + SSR)  ·  Cloudflare Workers   │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS  /api/v1/*
┌────────────────────────────▼────────────────────────────────┐
│              BACKEND  (Hugging Face Spaces Docker)          │
│   FastAPI 0.115  ·  Python 3.11  ·  Uvicorn 2 workers      │
│                                                             │
│  ┌──────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │  Job Router  │  │  RAG Pipeline   │  │  ATS Scorer   │  │
│  │  Adzuna +    │  │  Gemini 2.5 F.  │  │  Keyword      │  │
│  │  Arbeitnow + │  │  Embeddings +   │  │  match vs JD  │  │
│  │  Serper.dev  │  │  PGVector       │  │               │  │
│  └──────────────┘  └─────────────────┘  └───────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ asyncpg (connection pool)
┌────────────────────────────▼────────────────────────────────┐
│                   SUPABASE (PostgreSQL)                     │
│   Auth (JWT)  ·  PGVector (embeddings)  ·  Storage (PDFs)  │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature Highlights

| Feature | Detail |
|---|---|
| **Job Aggregation** | Live feeds from Adzuna, Arbeitnow, Serper — 230+ roles in DB |
| **AI Resume Analysis** | Gemini 2.5 Flash extracts skills, scores strengths/gaps |
| **ATS Score** | Keyword-match against any JD, with ranked missing terms |
| **RAG Career Coach** | Chat grounded in your resume + top jobs via PGVector |
| **Guest Mode** | Full experience without signup; 7-day local quota |
| **Idempotent API** | Every mutation carries `Idempotency-Key` + `x-request-id` |
| **CSP hardened** | Single canonical CSP across meta tag, `_headers`, `vercel.json` |

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Python 3.11 |
| API framework | FastAPI 0.115 + Pydantic v2 |
| Server | Uvicorn (2 workers) |
| Database | Supabase PostgreSQL via asyncpg + SQLAlchemy 2 |
| Vector store | PGVector (768-dim Gemini embeddings) |
| AI | Google Gemini 2.5 Flash (`gemini-2.5-flash`) |
| Embeddings | `gemini-embedding-2` (768 dims) |
| Job feeds | Adzuna API, Arbeitnow, Serper.dev |
| Auth | Supabase JWT (HS256) |
| Cache / Idempotency | Upstash Redis |
| Email | Resend |
| Bot protection | Cloudflare Turnstile |
| Observability | Sentry SDK |
| Container | Docker → Hugging Face Spaces |

### Frontend
| Layer | Technology |
|---|---|
| Framework | TanStack Start (React 19 + SSR) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + custom `@theme` tokens |
| Animation | Framer Motion + GSAP + Three.js |
| Components | shadcn/ui |
| State | TanStack Query v5 |
| Routing | TanStack Router v1 |
| Auth | Supabase client |
| Deploy | Cloudflare Workers (via Nitro) |

---

## API Reference

All routes are prefixed `/api/v1`. Full Swagger UI at `/docs`.

```
GET  /health                        Liveness
GET  /health/gemini                 Gemini model check
GET  /ready                         Readiness

GET  /api/v1/jobs                   List jobs  ?limit=20&offset=0&q=&remote=&tag=
GET  /api/v1/jobs/{id}              Job detail

POST /api/v1/auth/signup            Register
POST /api/v1/auth/login             Login → JWT
POST /api/v1/auth/refresh           Refresh token

POST /api/v1/resumes/upload         Upload PDF (multipart)
POST /api/v1/resumes/{id}/analyze   AI analysis (Gemini)
POST /api/v1/ats/score              ATS score vs JD text

POST /api/v1/chat                   Career coach (RAG)
GET  /api/v1/insights               Career trend insights

POST /api/v1/saved/{id}             Save job
DELETE /api/v1/saved/{id}           Unsave job
GET  /api/v1/saved                  Saved jobs list

GET  /api/v1/applications           My applications
POST /api/v1/applications           Apply to job
```

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 20+
- A Supabase project
- Google AI Studio API key ([get one free](https://aistudio.google.com/app/apikey))
- Adzuna API key ([register free](https://developer.adzuna.com/))

### 1 — Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1          # Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                  # fill in your keys
uvicorn app.main:app --reload --port 8000
```

Visit **http://localhost:8000/docs** for the interactive API explorer.

### 2 — Frontend

```powershell
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:8000   # dev fallback — auto-applied if absent
```

```powershell
npm run dev
```

App runs at **http://localhost:5173**.

---

## Production Deployment

### Backend → Hugging Face Spaces

The `backend/` directory is pushed as a standalone Docker space:

```powershell
# From repo root
$SNAP = "$env:TEMP\hf-snapshot"
Remove-Item -Recurse -Force $SNAP -ErrorAction SilentlyContinue
robocopy backend $SNAP /E /XD __pycache__ .venv venv .pytest_cache /XF .env /R:0

cd $SNAP
git init -b main
git remote add origin https://<HF_USER>:<HF_WRITE_TOKEN>@huggingface.co/spaces/<HF_USER>/<SPACE_NAME>
git add . && git commit -m "deploy"
git push --force origin main
```

Required Space Secrets (Settings → Variables and secrets):
```
GEMINI_API_KEY
DATABASE_URL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ADZUNA_APP_ID  /  ADZUNA_APP_KEY
UPSTASH_REDIS_REST_URL  /  UPSTASH_REDIS_REST_TOKEN
RESEND_API_KEY
TURNSTILE_SECRET_KEY
SENTRY_DSN
CRON_SECRET
ALLOWED_ORIGINS=https://your-frontend.app
```

### Frontend → Cloudflare Workers

```powershell
cd frontend
npm run build               # outputs to .output/
# Deploy via wrangler or push to repo — CI picks it up automatically
```

Environment variables (Cloudflare / Vercel dashboard):
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_API_URL=https://1amogh212-resume-intelligence.hf.space
VITE_SENTRY_DSN
VITE_TURNSTILE_SITE_KEY
```

---

## Security

See [`SECURITY.md`](SECURITY.md) for the full security posture.  
Quick summary:
- **CSP** enforced at three layers: meta tag, `_headers`, `vercel.json`
- **Idempotency-Key** on every mutation
- **Guest quotas** throttle AI actions without auth
- Supabase JWT verified server-side on every write
- Cloudflare Turnstile on sensitive guest-facing actions

---

## Project Structure

```
RAG-LLM/
├── backend/                  FastAPI application
│   ├── app/
│   │   ├── api/routes/       REST endpoints (auth, jobs, resumes, ats, chat…)
│   │   ├── core/             Config, deps, errors, security, Gemini client
│   │   ├── db/               Repositories + SQLAlchemy models
│   │   └── services/         Adzuna, Arbeitnow, Gemini, RAG pipeline
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/                 TanStack Start (React 19 SSR)
│   ├── src/
│   │   ├── routes/           Page components + root layout (CSP lives here)
│   │   ├── lib/api/          Type-safe API client + mock layer
│   │   ├── features/         Auth, resume, ATS, chat feature modules
│   │   └── components/       UI, FX, layout, landing
│   ├── public/_headers       Cloudflare/Netlify CSP + security headers
│   └── vercel.json           Vercel CSP + cache headers
├── supabase/
│   └── migrations/           PostgreSQL schema (PGVector, RLS policies)
├── docs/
│   └── ARCHITECTURE.md
└── SECURITY.md
```

---

## Contributing

1. Fork → feature branch → PR against `main`
2. Backend: `pytest backend/tests/` must pass
3. Frontend: `npm run build` must complete with zero TS errors

---

<div align="center">

Built by **Amogh Samadhiya** · MIT License

</div>
