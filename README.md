# Aether Resume Intelligence: Full-Stack RAG System

Aether Resume Intelligence is a production-grade Retrieval-Augmented Generation (RAG) platform designed for resume processing, job matching, and interview evaluation. The system consists of a Python FastAPI backend that serves vector ingestion and query endpoints, and a high-fidelity Next.js 15 App Router frontend that provides a playground interface for managing hyperparameters and conversation logs.

The architecture separates concerns across API boundaries to demonstrate scalable retrieval quality, local-first evaluation, and deployment capability to cloud and edge servers.

---

## Architecture and System Flow

The application handles document ingestion, chunking, and semantic search queries via a deterministic pipeline:

```
[Resume / Job Description] ---> [Document Loader] ---> [Text Chunker] ---> [Vector Index]
                                                                                |
[User Matching Query]       ---> [Embedding Engine] ---> [Semantic Matcher] <---+
                                                                   |
                                                                   v
                                                        [Grounded RAG Answer]
```

1. **Document Ingestion**: Parses PDFs, Markdown, and plain text files.
2. **Chunking Engine**: Splits documents into configurable sizes with overlap offsets.
3. **Local Vector Index**: Stores high-dimensional vector representations locally for low latency.
4. **Retrieval Grounding**: Matches user Q&A queries against stored documents, outputting grounded answers accompanied by citations and similarity scores.

---

## Technical Stack

### Backend
- **Core Runtime**: Python 3.11
- **API Framework**: FastAPI with typed Pydantic validation schemas
- **Inference Server**: Uvicorn
- **Evaluator Utilities**: Local indexing, similarity ranking, evaluation tests

### Frontend
- **Framework**: Next.js 15 (App Router Architecture)
- **Language**: TypeScript (Strict type checks)
- **Styling**: Tailwind CSS v4 featuring glassmorphism layers
- **Animations**: Framer Motion spring physics (target 60 FPS)
- **Background System**: HTML Canvas cinematic starfield with parallax mouse tracking
- **Cursor System**: Custom spring-dampened inertial cursor matching theme states

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

2. Start the development server with Turbopack enabled:
   ```powershell
   & '..\.bin\node\node.exe' 'node_modules\next\dist\bin\next' dev --turbopack
   ```
   The interactive interface will be accessible at `http://localhost:3000`.

---

## Command Line Interface (CLI) Utilities

You can perform administrative indexing and queries directly using the Python CLI:

1. Index a resume or job description file:
   ```powershell
   resume-rag ingest path\to\resume.pdf --type resume
   resume-rag ingest path\to\job-description.txt --type job
   ```

2. Execute a grounded query:
   ```powershell
   resume-rag query "What evidence proves this candidate has experience in RAG systems?"
   ```

3. Match a target job role against index credentials:
   ```powershell
   resume-rag match "AI Engineer" path\to\job-description.txt
   ```

---

## API Integration Specifications

### Ingest Document
- **Endpoint**: `POST http://127.0.0.1:8000/documents`
- **Payload**:
  ```json
  {
    "source": "resume.pdf",
    "doc_type": "resume",
    "text": "Built a FastAPI RAG pipeline with vector retrieval and grounded citations."
  }
  ```

### Execute Grounded Query
- **Endpoint**: `POST http://127.0.0.1:8000/query`
- **Payload**:
  ```json
  {
    "question": "What RAG experience is in the resume?",
    "top_k": 4
  }
  ```

### Role Fit Matching
- **Endpoint**: `POST http://127.0.0.1:8000/match`
- **Payload**:
  ```json
  {
    "role_title": "AI Engineer",
    "job_description": "Requires Python, FastAPI, RAG, and Docker experience."
  }
  ```

---

## Production Deployment Architecture

To host a production release of the full-stack system:

### 1. Backend: Hugging Face Spaces (Docker SDK)
The backend uses a Docker configuration.
- The project Dockerfile is configured to run Uvicorn on port `7860`, matching Hugging Face specifications.
- Create a Space using the Docker SDK template.
- Push the repository files (`src/`, `pyproject.toml`, `Dockerfile`) to the Space.
- Add environment secrets such as `RESUME_RAG_OPENAI_API_KEY` under settings.

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
pytest
```
