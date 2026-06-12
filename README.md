# Aether Resume Intelligence: Full-Stack Career RAG System

Aether Resume Intelligence is a production-grade Retrieval-Augmented Generation (RAG) platform and Career Intelligence Board. It is designed for resume processing, ATS evaluation, skill gap analysis, job matching, and AI-driven interview preparation. 

Powered by the **Gemini API** (`gemini-flash-latest` and `gemini-embedding-2`), the system leverages bulk vector generation to sidestep rate limits and provide instant, responsive career intelligence. The application consists of a Python FastAPI backend and a high-fidelity Next.js 15 App Router frontend featuring a modern workspace and a dynamic Job Intelligence Board.

---

## 🌟 Key Features

1. **Job Intelligence Board**: A dedicated career UI to paste your resume and instantly receive an ATS compatibility score, a skill graph breakdown, and semantic job matching against an indexed job database.
2. **Interactive Keyword Refiner**: Dynamically add, remove, and refine skills. The system instantly suggests missing keywords extracted from top matched jobs. Click to add them and watch your ATS score update live!
3. **AI Interview Prep Simulations**: Automatically generates custom technical, behavioral, and system design interview questions tailored directly to the intersection of the candidate's resume and the job's demands.
4. **SSE Streaming RAG Workspace**: A fully interactive chat interface that leverages Server-Sent Events (SSE) to stream answers from grounded context in real-time.
5. **Rate-Limit Resilient Bulk Ingestion**: Parses PDFs, Markdown, and text, converting them into optimized vector embeddings via batch requests, avoiding common `429 Too Many Requests` API limits.

---

## Technical Stack

### Backend
- **Core Runtime**: Python 3.11/3.12
- **API Framework**: FastAPI with typed Pydantic validation schemas
- **Inference Server**: Uvicorn, Server-Sent Events (SSE)
- **AI Models**: Google Gemini API (`gemini-flash-latest` for inference, `gemini-embedding-2` for batch embed mapping)
- **Vector Operations**: SQLite Vector Store, Embedding Engines, RRF (Reciprocal Rank Fusion)

### Frontend
- **Framework**: Next.js 15 (App Router Architecture, Turbopack)
- **Language**: TypeScript (Strict type checks)
- **Styling**: Tailwind CSS v4 featuring dynamic theming (Dark/Light mode + 5 Accent Colors), glassmorphism layers, and custom radial SVG dials
- **Animations**: Framer Motion spring physics for fluid micro-interactions
- **State**: React Context API for complex cross-component RAG synchronization

---

## Local Development Setup

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
   Create a `.env` file from `.env.example` and set your Gemini API key:
   ```
   GEMINI_API_KEY=your-gemini-api-key-here
   ```

4. Run the FastAPI development server:
   ```powershell
   uvicorn src.resume_rag.api:app --reload
   ```
   The backend API document explorer will be accessible at `http://127.0.0.1:8000/docs`.

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

3. Start the development server with Turbopack enabled:
   ```powershell
   npm run dev
   ```
   The interactive interface will be accessible at `http://localhost:3000`.

---

## Production Deployment Architecture

This project is built for a split-stack deployment using Edge CDNs and containerized environments.

### 1. Backend: Railway (or Hugging Face Spaces)
The backend is completely containerized.
- Connect your GitHub repository to **Railway**.
- Railway will automatically detect the `Dockerfile` and build your image.
- Set the `GEMINI_API_KEY` under the service variables in the Railway dashboard.
- Railway will handle the port bindings (`$PORT`) automatically and expose a secure HTTPS URL.

### 2. Frontend: Vercel
- Import your GitHub repository on **Vercel**.
- **Crucial step:** In the Vercel project configuration, set the **"Root Directory"** to `frontend`.
- Add an environment variable:
  - `NEXT_PUBLIC_API_URL` set to your public Railway backend URL (e.g., `https://your-backend.up.railway.app`).
- Deploy! Vercel compiles the static pages and serves the web UI at a global edge CDN.

---

## Acknowledgments
Designed and crafted to demonstrate production-ready integration between modern AI models and fluid user interfaces.
