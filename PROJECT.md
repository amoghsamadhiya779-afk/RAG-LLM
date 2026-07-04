# Project: jOBiON Landing Page Background & Theme Upgrade

## Architecture
This is a React 19 + TanStack Router/Start + Vite 8 frontend app.
- **Root Layout (`__root.tsx`)**: Wraps the entire application. We want the `GalaxyBackground` to only render for the landing page (`/` route) as a unified background, while `DotFieldBackground` runs for all other routes.
- **Landing Route (`index.tsx`)**: Renders `<PixelHero />` and other sections of the landing page.
- **Backgrounds**:
  - `GalaxyBackground.tsx` / `Galaxy.jsx`: WebGL star field shader (OGL) - needs to cover the viewport fixed behind content on the `/` route.
  - `Grainient.jsx`: WebGL grain-gradient shader (OGL) - renders inside the hero section with a semi-transparent blend.
  - `DotFieldBackground.tsx`: Used on non-landing pages (already excludes `/` - left untouched).
- **Styling**: `styles.css` is where global styles, Tailwind CSS v4 directives, font imports, and theme variable transitions go.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|--------------|--------|
| M1 | Setup & Design | Load "Outfit" Google Font, configure `PROJECT.md` and `plan.md`. | None | DONE |
| M2 | Galaxy Background | Mount `GalaxyBackground` fixed behind all content for `/` route, scale light-mode opacity/invert. | M1 | PLANNED |
| M3 | Grainient & Hero UI | Blend Grainient (50/50) in Hero section, style Hero text with "Outfit", verify contrast. | M2 | PLANNED |
| M4 | Theme Transitions | CSS transitions on HTML, background elements, hero text, and button components. | M3 | PLANNED |
| M5 | E2E Testing & Audit | Verify build passes, no TypeScript errors, run E2E checks, and final Forensic Audit. | M4 | PLANNED |

## Code Layout
- `src/routes/__root.tsx` - Root layout
- `src/routes/index.tsx` - Landing page route
- `src/components/ui/pixel-perfect-hero.tsx` - Hero section (renders Grainient)
- `src/components/landing/GalaxyBackground.tsx` - Galaxy canvas wrapper
- `src/components/landing/Galaxy.jsx` - WebGL canvas implementation
- `src/styles.css` - Global CSS (Tailwind v4)
