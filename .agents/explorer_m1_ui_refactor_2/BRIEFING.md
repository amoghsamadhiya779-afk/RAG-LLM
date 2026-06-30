# BRIEFING — 2026-06-30T14:21:55Z

## Mission
Investigate the React/Next.js frontend files to prepare for refactoring the frontend into a "Single Hero Website".

## 🔒 My Identity
- Archetype: preview explorer
- Roles: explorer, analyst
- Working directory: C:\Users\Lenovo\Desktop\RAG & LLM\.agents\explorer_m1_ui_refactor_2
- Original parent: 80c5abef-1ad8-43f6-b1d6-3c2b88b40c0e
- Milestone: UI Refactor Milestone 1 Exploration

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Focus strictly on frontend files

## Current Parent
- Conversation ID: 80c5abef-1ad8-43f6-b1d6-3c2b88b40c0e
- Updated: 2026-06-30T14:21:55Z

## Investigation State
- **Explored paths**:
  - `frontend/src/app/jobs/page.tsx`
  - `frontend/src/app/companies/page.tsx`
  - `frontend/src/app/ai-workspace/page.tsx`
  - `frontend/src/app/page.tsx`
  - `frontend/src/components/site/header.tsx`
  - `frontend/src/hooks/use-highlight.ts`
  - `frontend/src/hooks/use-lenis.ts`
  - `frontend/src/components/animation/smooth-scroll.tsx`
  - `frontend/src/lib/motion.ts`
- **Key findings**:
  - `jobs/page.tsx` uses `useSearchParams()` which will cause static deoptimization when integrated on the homepage unless wrapped in a `<Suspense>` boundary inside the section component itself.
  - Page-specific elements like `<SiteHeader />` must be removed from the section components since the header is rendered at the page/layout level.
  - Page-wide backgrounds and gradients in `jobs/page.tsx` need layout constraint wrapping to prevent overlapping/bleeding into adjacent homepage sections.
  - `SiteHeader` should be refactored to support conditional hash links (e.g. `/#jobs` vs `#jobs`) depending on whether the user is on the homepage.
  - The `useHighlightSection` hook can be improved by adding a `hashchange` listener to handle same-page scrolling correctly when clicking links on the homepage.
- **Unexplored areas**: None, all items in the scope were fully examined.

## Key Decisions Made
- Wrap the extracted `jobs-section.tsx` in a `<Suspense>` boundary internally.
- Outline clear, drop-in replacement/proposed code for all 5 requested components.
- Recommend updating `useHighlightSection` to handle `hashchange` events.

## Artifact Index
- C:\Users\Lenovo\Desktop\RAG & LLM\.agents\explorer_m1_ui_refactor_2\handoff.md — Final investigation report
