## 2026-06-30T07:26:16Z
You are a Worker (archetype: teamwork_preview_worker).
Your working directory is: c:\Users\Lenovo\Desktop\RAG & LLM\.agents\worker_m1_reorg

Your task is to reorganize the monorepo for Milestone 1 by relocating the React/Vite frontend files from the project root to `frontend/` directory, while keeping the Python RAG core files intact in `src/resume_rag`.

Here are the step-by-step instructions:
1. Delete all Next.js boilerplate files and folders currently in `frontend/`. This includes:
   - frontend/README.md
   - frontend/eslint.config.mjs
   - frontend/next-env.d.ts
   - frontend/next.config.ts
   - frontend/postcss.config.mjs
   - frontend/package.json
   - frontend/package-lock.json
   - frontend/tsconfig.json
   - frontend/.env.local
   - frontend/.gitignore
   - frontend/.next
   - frontend/node_modules
   - frontend/public
   - frontend/src
   Ensure that the `frontend/` directory is completely empty or ready for the new files.

2. Move the Vite/React frontend files and directories from the root directory into `frontend/`:
   - package.json -> frontend/package.json
   - package-lock.json -> frontend/package-lock.json
   - bun.lock -> frontend/bun.lock
   - bunfig.toml -> frontend/bunfig.toml
   - components.json -> frontend/components.json
   - eslint.config.js -> frontend/eslint.config.js
   - .prettierrc -> frontend/.prettierrc
   - .prettierignore -> frontend/.prettierignore
   - tsconfig.json -> frontend/tsconfig.json
   - vite.config.ts -> frontend/vite.config.ts
   - .env -> frontend/.env
   - .env.example -> frontend/.env.example
   - public/ -> frontend/public/
   - The following directories/files under `src/` to `frontend/src/`:
     - src/components
     - src/hooks
     - src/integrations
     - src/lib
     - src/routes
     - src/services
     - src/types
     - src/routeTree.gen.ts
     - src/router.tsx
     - src/server.ts
     - src/start.ts
     - src/styles.css

   IMPORTANT: Do NOT move or delete `src/resume_rag` or `src/resume_rag_command_center.egg-info`. These are Python backend files and must remain at the root `src/` directory exactly as they are.

3. Inside the `frontend/` directory, run `bun install` or `npm install`, then run the build command (`bun run build` or `npm run build`) to ensure the frontend compiles and builds successfully in its new directory. Verify that it completes successfully with exit code 0.

4. Once the relocation is done and build succeeds, verify:
   - There are no frontend files left in the project root (e.g. no vite.config.ts, no package.json, no components.json, etc.).
   - The Python RAG core package at `src/resume_rag` is still intact and unaffected.

5. Write a handoff.md report inside your working directory summarizing:
   - The files you deleted from frontend/.
   - The files you relocated from root to frontend/.
   - The command you used to build the frontend inside frontend/, and the output/result.
   - Verification that the build succeeded and no frontend files remain in root.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT
hardcode test results, create dummy/facade implementations, or
circumvent the intended task. A Forensic Auditor will independently
verify your work. Integrity violations WILL be detected and your
work WILL be rejected.
