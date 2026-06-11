# Aether Resume Intelligence: Full-Stack Career RAG System

Aether Resume Intelligence is a production-grade Retrieval-Augmented Generation (RAG) platform and Career Intelligence Board. It is designed for resume processing, ATS evaluation, skill gap analysis, job matching, and AI-driven interview preparation. The system consists of a Python FastAPI backend that serves vector ingestion, streaming queries, and ATS analysis endpoints, and a high-fidelity Next.js 15 App Router frontend featuring a modern workspace and Job Intelligence Board.

The architecture separates concerns across API boundaries to demonstrate scalable retrieval quality, local-first evaluation, and deployment capability to cloud and edge servers.

---

## 🌟 Key Features

1. **Job Intelligence Board**: A dedicated career UI to paste your resume and instantly receive an ATS compatibility score, a skill graph breakdown, and semantic job matching against an indexed job database.
2. **AI Interview Prep Simulations**: Automatically generates custom technical, behavioral, and system design interview questions tailored directly to the intersection of the candidate's resume and the job's demands.
3. **SSE Streaming RAG Workspace**: A fully interactive chat interface that leverages Server-Sent Events (SSE) to stream answers from grounded context in real-time.
4. **Document Ingestion & Chunking**: Parses PDFs, Markdown, and text, converting them into optimized vector embeddings stored locally (SQLite/JSON) for low latency.

---

## Architecture and System Flow

The application handles document ingestion, semantic matching, and ATS evaluations via deterministic and AI pipelines:

```
[Candidate Resume] ---> [Skill Graph Extraction] ---> [ATS Formatting & Content Scorer]
                            |
                            v
[Job Embeddings]   <--- [Semantic Vector Search] ---> [Job Recommendation Matcher]
                                                          |
                                                          v
                                              [AI Interview Question Generator]
```

---

## Technical Stack

### Backend
- **Core Runtime**: Python 3.12
- **API Framework**: FastAPI with typed Pydantic validation schemas
- **Inference Server**: Uvicorn, Server-Sent Events (SSE)
- **Vector Operations**: SQLite Vector Store, Embedding Engines, RRF (Reciprocal Rank Fusion)
- **Evaluator Utilities**: Regex heuristic parsing and fallback LLM profile extraction

### Frontend
- **Framework**: Next.js 15 (App Router Architecture)
- **Language**: TypeScript (Strict type checks)
- **Styling**: Tailwind CSS v4 featuring glassmorphism layers and custom radial SVG dials
- **Animations**: Framer Motion spring physics (target 60 FPS)
- **Design Elements**: Cinematic starfield, animated progress rings, responsive sidebars

---

## Local Development Setup

### Backend API Setup

1. Create a Python virtual environment:
   ```powershell
   python -m venv .venv
   ```

2. Activate the virtual environment:
   ```powershell
   .\.venv\Scripts\Activate.ps1
   ```

3. Install backend dependencies in developer mode:
   ```powershell
   python -m pip install -e ".[dev]"
   ```

4. Initialize environment configuration:
   ```powershell
   copy .env.example .env
   ```

5. Run the FastAPI development server:
   ```powershell
   uvicorn resume_rag.api:app --reload
   ```
   The backend API document explorer will be accessible at `http://127.0.0.1:8000/docs`.

---

### Frontend Setup

A portable Node.js environment is downloaded locally to `.bin/node` to isolate development.

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

## API Integration Specifications

### 1. ATS Profile Parsing & Analysis
- **Endpoint**: `POST http://127.0.0.1:8000/analyze/resume`
- **Description**: Analyzes a raw resume string, extracts a structured skill graph, and computes an ATS score.

### 2. Job Recommendations
- **Endpoint**: `POST http://127.0.0.1:8000/analyze/match`
- **Description**: Conducts RAG similarity searches within the job database, computing a hybrid match score combining semantic context overlap and skill graph intersections.

### 3. Interview Preparation
- **Endpoint**: `POST http://127.0.0.1:8000/analyze/interview`
- **Description**: Generates dynamic interview simulations (behavioral, technical, and system design) tailored to the candidate's exact profile and the specific job role.

### 4. Streaming Grounded RAG Query
- **Endpoint**: `POST http://127.0.0.1:8000/query/stream`
- **Description**: Uses Server-Sent Events (SSE) to stream citations and LLM tokens.

---

## Production Deployment Architecture

To host a production release of the full-stack system:

### 1. Backend: Hugging Face Spaces (Docker SDK)
The backend uses a Docker configuration.
- The project Dockerfile is configured to run Uvicorn on port `7860`, matching Hugging Face specifications.
- Create a Space using the Docker SDK template.
- Push the repository files (`src/`, `pyproject.toml`, `Dockerfile`) to the Space.
- Add environment secrets such as `OPENAI_API_KEY` under settings.

### 2. Frontend: Vercel
- Import the `frontend` directory repository on Vercel.
- Configure the environment variable:
  `NEXT_PUBLIC_API_URL` set to your public Hugging Face Space URL.
- Deploy. Vercel compiles the static pages and serves the web UI at a global edge CDN.

---

## Testing and Linting

Validate your local backend changes prior to committing:
```powershell
ruff check src tests
pytest -p no:cacheprovider
```
