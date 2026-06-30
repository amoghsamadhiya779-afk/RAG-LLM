# Scope: Milestone 1: Monorepo Reorganization

## Architecture
- **Frontend**: Vite/React application built with Tailwind CSS, Radix UI, TanStack Router/Start. Moving to `frontend/`.
- **Backend/RAG Core**: `src/resume_rag` containing FastAPI routes, document parsing, embeddings, and vector store operations. Stays in root `src/resume_rag` to maintain standard Python project layout and its editable installation (`pyproject.toml`).
- **Backend App**: `backend/` containing a FastAPI app, which will integrate with RAG core in Milestone 3.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M1.1 | Relocate Frontend Files | Move React/Vite app root files and non-RAG src folders to `frontend/` | None | DONE |
| M1.2 | Update Configs & Paths | Update paths, import aliases, and config files for Vite, tsconfig, etc. | M1.1 | DONE |
| M1.3 | Verify Frontend Build | Run frontend install and build inside `frontend/` | M1.2 | DONE |
| M1.4 | Verify Root Cleanup | Verify no React/Vite files remain in the root directory | M1.1 | DONE |
| M1.5 | Integrity Audit | Run Forensic Auditor to certify clean execution | M1.3, M1.4 | DONE |

## Interface Contracts
- No API contracts changed during this reorg. The base layout and environment paths are updated.
