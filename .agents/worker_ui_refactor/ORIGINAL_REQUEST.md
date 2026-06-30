## 2026-06-30T14:22:52Z
You are a teamwork_preview_worker.
Your working directory is: C:\Users\Lenovo\Desktop\RAG & LLM\.agents\worker_ui_refactor
Your parent conversation ID is: 80c5abef-1ad8-43f6-b1d6-3c2b88b40c0e

Objective:
Refactor the React/Next.js frontend in the `frontend` folder into a "Single Hero Website" layout according to the aggregated explorer recommendations.

Input Files & Context:
- PROJECT.md path: C:\Users\Lenovo\Desktop\RAG & LLM\.agents\orchestrator_ui_refactor\PROJECT.md
- Extracted section specifications and layouts detailed in Explorer handoff files:
  - C:\Users\Lenovo\Desktop\RAG & LLM\.agents\explorer_m1_ui_refactor_1\handoff.md
  - C:\Users\Lenovo\Desktop\RAG & LLM\.agents\explorer_m1_ui_refactor_3\handoff.md

Key Tasks:
1. **Extract Section Components**:
   - Extract `src/app/jobs/page.tsx` core content into `src/components/sections/jobs-section.tsx`. Ensure it is wrapped in an internal `<Suspense>` boundary inside the section export to prevent static deoptimization on the homepage.
   - Extract `src/app/companies/page.tsx` core content into `src/components/sections/companies-section.tsx`.
   - Extract `src/app/ai-workspace/page.tsx` core content into `src/components/sections/ai-workspace-section.tsx`. Remove the `SiteHeader` imports and page-level layouts where appropriate.
2. **Delete Old Standalone Route Pages**:
   - Completely delete `src/app/jobs/page.tsx`.
   - Completely delete `src/app/companies/page.tsx`.
   - Completely delete `src/app/ai-workspace/page.tsx`.
   - (Keep item detail subpages like `/jobs/[id]` and `/companies/[id]` intact).
3. **Assemble Integrated Homepage**:
   - Modify `src/app/page.tsx` to render the newly extracted sections vertically. Wrap each section component in a distinctly ID'd section tag matching their hashes (e.g. `<section id="jobs">`).
   - Integrate premium landing page components already located under `src/components/landing/` (including `LogoMarquee`, `SplitFeature` with `MatchVisual` / `PipelineVisual`, `PricingCards`, and `FAQ`) into the layout of `src/app/page.tsx` to give it a modern, production-grade premium appearance.
4. **Overhaul Navigation Header**:
   - Refactor `src/components/site/header.tsx` so navigation links conditionally resolve:
     - On homepage (`/`): Prevent full-page reloads and scroll smoothly using Lenis (`lenis.scrollTo(hash, { offset: -80 })`) or HTML native scrolling fallback.
     - On other routes: Link using absolute paths (e.g. `/#jobs`, `/#companies`, `/#ai-workspace`) so navigation successfully returns to the homepage and highlights/scrolls to the target section on mount.
5. **Compilation and Validation**:
   - Verify the codebase build by executing the compilation check: run `npm run build` from the `frontend/` directory. Ensure it compiles cleanly with zero errors.
   - Output the build log and verification confirmation in your handoff report.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Output:
Write your handoff report to `C:\Users\Lenovo\Desktop\RAG & LLM\.agents\worker_ui_refactor\handoff.md` and send a message back to the orchestrator (conversation ID: 80c5abef-1ad8-43f6-b1d6-3c2b88b40c0e) when complete.
