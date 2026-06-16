
# Drew Resume Intelligence: SaaS Career RAG System

Drew Resume Intelligence is a production-grade Retrieval-Augmented Generation (RAG) platform and Career Intelligence Board. It is designed for resume processing, ATS evaluation, skill gap analysis, job matching, and AI-driven interview preparation. 

Recently completely overhauled with a **Premium SaaS Dark-Mode UI** and an ultra-resilient backend architecture, the system leverages the **Google Gemini 1.5 Flash** model for inference and bulk vector generation to sidestep rate limits and provide instant, responsive career intelligence.

---

## 🌟 Key Features

1. **SaaS Job Intelligence Board**: A stunning, premium career UI with glassmorphism to paste your resume and instantly receive an ATS compatibility score, a skill graph breakdown, and semantic job matching against an indexed job database.
2. **Resilient Local Fallback**: The backend intelligently detects if your `GEMINI_API_KEY` is missing or invalid, and gracefully falls back to a powerful local NLP-based extraction engine so the application *never crashes*.
3. **Interactive Keyword Refiner**: Dynamically add, remove, and refine skills. The system instantly suggests missing keywords extracted from top matched jobs. Click to add them and watch your ATS score update live!
4. **AI Interview Prep Simulations**: Automatically generates custom technical, behavioral, and system design interview questions tailored directly to the intersection of the candidate's resume and the job's demands.
5. **Rate-Limit Resilient Bulk Ingestion**: Parses PDFs, Markdown, and text, converting them into optimized vector embeddings via batch requests, avoiding common `429 Too Many Requests` API limits.

---

## 🛠 Technical Stack

### Backend
- **Core Runtime**: Python 3.11/3.12
- **API Framework**: FastAPI with typed Pydantic validation schemas
- **Inference Server**: Uvicorn, Server-Sent Events (SSE)
- **AI Models**: Google Gemini API (`gemini-1.5-flash` for high-speed inference)
- **Vector Operations**: SQLite Vector Store, SentenceTransformer Embedding Engines, RRF (Reciprocal Rank Fusion)

### Frontend
- **Framework**: Next.js 15 (App Router Architecture, Turbopack)
- **Language**: TypeScript (Strict type checks)
- **Styling**: Tailwind CSS v4 featuring premium dark-mode SaaS theming, glassmorphism panels, glowing accents, and dynamic UI elements.
- **Animations**: Framer Motion spring physics for fluid micro-interactions and SVG progress dials.
- **State**: React Context API for complex cross-component RAG synchronization.

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
   Create a `.env` file from `.env.example` and set your Gemini API key (optional - will gracefully fallback to local NLP if omitted):
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

## 🌐 Production Deployment Architecture

This project is built for a split-stack deployment using Edge CDNs and containerized environments.

### 1. Backend: Hugging Face Spaces (or Railway)
The backend is completely containerized and includes native YAML metadata for Hugging Face Spaces.
- Create a new Docker Space on **Hugging Face**.
- Push this repository directly to your Space. The Space will automatically detect the `sdk: docker` frontmatter in this README and build the Dockerfile.
- Set the `GEMINI_API_KEY` under the Space Secrets.
- Hugging Face automatically exposes the internal API on port `7860`.

### 2. Frontend: Vercel
- Import your GitHub repository on **Vercel**.
- **Crucial step:** In the Vercel project configuration, set the **"Root Directory"** to `frontend`.
- Add an environment variable:
  - `NEXT_PUBLIC_API_URL` set to your public Hugging Face backend URL (e.g., `https://username-spacename.hf.space`).
- Deploy! Vercel compiles the static pages and serves the web UI at a global edge CDN.

---

## Acknowledgments
Designed and crafted to demonstrate production-ready integration between modern AI models and fluid user interfaces, with a robust self-healing architecture.
