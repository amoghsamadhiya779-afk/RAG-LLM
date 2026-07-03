---
title: jOBiON
emoji: 🚀
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# 🚀 jOBiON: AI-Native Tech Job Board

**Lead Developer:** Amogh Samadhiya (@amoghsamadhiya779)

jOBiON is a production-grade, AI-native career intelligence platform engineered for the modern tech landscape. It combines a premium, hardware-accelerated SaaS interface with an ultra-resilient FastAPI backend to deliver lightning-fast job routing, intelligent resume matching, and deep career insights.

---

## 🌟 Key Features

1. **Premium Volt Graphite UI**: A stunning, high-performance interface engineered with strict grid discipline, tabular typography, and subtle reactive motion using Framer Motion.
2. **AI-Native Matching Engine**: Powered by **Google Gemini 1.5 Flash** for high-speed resume inference, skills extraction, and intelligent job matching.
3. **Resilient Local Fallback**: The backend intelligently detects missing AI provider keys and gracefully degrades, ensuring the core platform remains functional without crash-looping.
4. **Interactive Keyword Refiner**: Dynamically add, remove, and refine skills extracted from top matched jobs to tailor your search.
5. **Real-time Infrastructure**: Built on Supabase PostgreSQL for robust authentication and high-performance vector operations (PGVector).

---

## 🛠 Technical Stack

### Frontend (Web UI)
- **Framework**: TanStack Start (Vite + React Router)
- **Language**: TypeScript (Strict type checks)
- **Styling**: Tailwind CSS v4 with custom `@theme` tokens and glassmorphism UI components.
- **Animations**: Framer Motion with locked ease curves and ambient backgrounds (React Bits).
- **Components**: Shadcn UI (optimized for absolute minimalism).

### Backend (API)
- **Core Runtime**: Python 3.12+
- **API Framework**: FastAPI with strictly typed Pydantic validation.
- **Database**: Supabase PostgreSQL (via asyncpg connection pooling with SQLAlchemy).
- **AI Models**: Google Gemini API (`gemini-1.5-flash`).
- **Data Integrations**: Adzuna Job Search API, Serper.dev, Langsearch.

---

## 🚀 Local Development Setup

### 1. Backend Setup

Navigate to the `backend` directory and set up your Python environment:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install backend dependencies:

```powershell
pip install -r requirements.txt
```

Initialize environment configuration:
Create a `.env` file in the `backend/` directory and configure your credentials (see `.env.dummy` for reference).
```env
GEMINI_API_KEY=your-gemini-api-key-here
DATABASE_URL=postgresql+asyncpg://postgres:your-password@db.supabase.co:5432/postgres
```

Run the FastAPI development server:

```powershell
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The API will be available at `http://localhost:8000`.

---

### 2. Frontend Setup

Navigate to the `frontend` directory:

```powershell
cd frontend
```

Install node dependencies:

```powershell
npm install
```

Configure your environment:
Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL=http://localhost:8000
```

Start the Vite development server:

```powershell
npm run dev
```
The interactive web app will be accessible at `http://localhost:5173`.

---

## 🌐 Production Deployment Architecture

jOBiON is designed for a split-stack deployment across Edge CDNs and containerized platforms.

### 1. Frontend: Vercel (Edge CDN)
- **Framework Preset**: Vercel Native via TanStack Start.
- **Root Directory**: `frontend`
- **Build Command**: `vite build`
- Vercel automatically compiles the Nitro node-server output and deploys it globally.

### 2. Backend: Docker / Hugging Face Spaces
- **Containerization**: Deployed via Docker container on Hugging Face Spaces (or Render/Railway).
- **Port Mapping**: Exposes the internal FastAPI app on port `7860` (Hugging Face default) or `8000`.
- **Environment**: Managed securely via platform-specific secrets (e.g., Space Secrets).

---

## 🙌 Acknowledgments
Architected and developed by **Amogh Samadhiya**. Designed to demonstrate production-ready integration between modern AI models and fluid user interfaces, with a robust self-healing deployment pipeline.
