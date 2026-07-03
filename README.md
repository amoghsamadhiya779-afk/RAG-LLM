---
title: jOBiON
emoji: 🚀
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# jOBiON: AI-Native Tech Job Board

jOBiON is a production-grade, AI-native career intelligence platform built for modern engineers. It features a premium, vibe-coded SaaS UI with lightning-fast routing, real-time matching, and an ultra-resilient FastAPI backend.

---

## 🌟 Key Features

1. **Premium Volt Graphite UI**: A stunning, hardware-accelerated interface engineered with strict 4px grid discipline, tabular typography, and subtle reactive motion.
2. **AI-Native Matching**: Powered by **Google Gemini 1.5 Flash** for high-speed resume inference and bulk vector generation to sidestep rate limits.
3. **Resilient Local Fallback**: The backend intelligently detects if your `GEMINI_API_KEY` is missing and gracefully falls back to a local NLP extraction engine.
4. **Interactive Keyword Refiner**: Dynamically add, remove, and refine skills extracted from top matched jobs.
5. **Supabase Integration**: Robust authentication and real-time database management through Supavisor and SQLAlchemy.

---

## 🛠 Technical Stack

### Frontend
- **Framework**: TanStack Start (Vite + React Router)
- **Language**: TypeScript (Strict type checks)
- **Styling**: Tailwind CSS v4 with premium custom `@theme` tokens, locked typography scales (Inter Variable), and glassmorphism panels.
- **Animations**: Framer Motion with locked ease curves (no bouncy physics), subtle fade-rises, and React Bits `DotField` ambient backgrounds.
- **Components**: Shadcn UI (retuned for absolute minimalism and tight radii).

### Backend
- **Core Runtime**: Python 3.11+
- **API Framework**: FastAPI with typed Pydantic validation
- **Database**: Supabase PostgreSQL with Supavisor connection pooling (Statement Cache = 0)
- **AI Models**: Google Gemini API (`gemini-1.5-flash`)
- **Vector Operations**: SQLite Vector Store, SentenceTransformer

---

## 🚀 Local Development Setup

### Backend API Setup

1. Create and activate a Python virtual environment:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

2. Install backend dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

3. Initialize environment configuration:
   Create a `.env` file in the root and set your required variables. Missing variables will fail loudly on startup.
   ```
   GEMINI_API_KEY=your-gemini-api-key-here
   DATABASE_URL=your-supabase-url-here
   ```

4. Run the FastAPI development server:
   ```powershell
   uvicorn src.resume_rag.api:app --reload
   ```

---

### Frontend Setup

1. Navigate to the frontend workspace folder:
   ```powershell
   cd frontend
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start the development server:
   ```powershell
   npm run dev
   ```
   The interactive interface will be accessible at `http://localhost:3000`.

---

## 🌐 Production Deployment Architecture

This project is built for a split-stack deployment using Edge CDNs and containerized environments.

### 1. Backend: Hugging Face Spaces (or Railway)
- Deployed via Docker container on Hugging Face Spaces.
- Uses `production-deploy` branch to maintain a clean git history and comply with platform limits.
- Set the `GEMINI_API_KEY` under the Space Secrets.
- Hugging Face automatically exposes the internal API on port `7860`.

- Import your GitHub repository on **Vercel**.
- **Crucial step:** In the Vercel project configuration, set the **"Root Directory"** to `frontend`.
- Add an environment variable:
  - `NEXT_PUBLIC_API_URL` set to your public Hugging Face backend URL (e.g., `https://username-spacename.hf.space`).
- Deploy! Vercel compiles the static pages and serves the web UI at a global edge CDN.

---

## Acknowledgments
Designed and crafted to demonstrate production-ready integration between modern AI models and fluid user interfaces, with a robust self-healing architecture.
