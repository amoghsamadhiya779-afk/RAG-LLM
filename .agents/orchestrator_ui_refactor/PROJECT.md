# Project: Single Hero Website UI Refactor

## Architecture
The DevBoard Next.js frontend is being refactored from a multi-page app with separate routes into a single-page scrolling "Single Hero Website".
- **Homepage (`src/app/page.tsx`)**: The main landing page will now vertically integrate three main sections: Jobs, Companies, and AI Workspace.
- **Section Components**: Core UI logic for these sections will be extracted into separate, reusable components in `src/components/sections/`.
- **Navigation (`src/components/site/header.tsx`)**: Overhauled to use smooth-scrolling hash links (e.g. `#jobs`, `#companies`, `#ai-workspace`) instead of router links, resolving dynamically when on the homepage.
- **Stand-alone route deletion**: Standalone pages `src/app/jobs/page.tsx`, `src/app/companies/page.tsx`, and `src/app/ai-workspace/page.tsx` will be completely deleted.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M1 | Section Component Extraction | Extract logic from `app/jobs/page.tsx`, `app/companies/page.tsx`, and `app/ai-workspace/page.tsx` into reusable React components in `src/components/sections/` | None | PLANNED |
| M2 | Standalone Route Deletion | Delete the original standalone routes `src/app/jobs/page.tsx`, `src/app/companies/page.tsx`, and `src/app/ai-workspace/page.tsx` | M1 | PLANNED |
| M3 | Homepage Integration | Render extracted components vertically inside distinct `<section id="...">` tags in `src/app/page.tsx` | M2 | PLANNED |
| M4 | Navbar Overhaul | Update `src/components/site/header.tsx` to use `#` anchor links for navigation | M3 | PLANNED |
| M5 | Build & Compilation Verification | Run `npm run build` from `frontend/` directory and verify that compilation completes with exit code 0 | M4 | PLANNED |

## Interface Contracts
### Section Components
- All extracted section components must be self-contained and export a single default or named React component.
- Any routing logic (like `useRouter` or `useSearchParams`) inside the extracted components must be handled gracefully to prevent breakage when rendered on the homepage.

## Code Layout
```
frontend/src/
├── app/
│   ├── page.tsx               # Integrates Jobs, Companies, AI Workspace sections
│   └── dashboard/page.tsx     # (Kept as standalone)
├── components/
│   ├── sections/              # New folder for extracted sections
│   │   ├── jobs-section.tsx
│   │   ├── companies-section.tsx
│   │   └── ai-workspace-section.tsx
│   └── site/
│       └── header.tsx         # Updated navigation header
```
