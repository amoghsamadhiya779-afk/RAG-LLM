# Volt Graphite Rebrand

Linear-style minimal: graphite surfaces, silver ink, ONE electric-blue accent (#2E6FFF / #4C82FF dark). No feature changes — visual + brand asset swap only.

## 1. Tokens (`src/styles.css`)

Replace the current OKLCH block with Volt Graphite values:

- Light: `--background` #FAFAFB, `--foreground` #1A1D21, `--card` #FFF, `--muted` #F4F5F7, `--border` #E4E5E8, `--primary` oklch(0.5 0.21 262), `--ring` oklch(0.55 0.22 262), `--destructive` oklch(0.55 0.19 25), success/warning muted.
- Dark: `--background` #0B0C0E, `--card` #141518, `--foreground` #E6E8EB, `--muted-foreground` #A0A4AB, `--border` #2A2D33, `--primary` oklch(0.62 0.19 262), `--primary-foreground` near-black.
- Delete brand-gradient/aurora custom properties (`--brand-gradient`, `--aurora-*`). Keep only a tiny `--jobion-volt` for the logo node.
- Verify AA on both themes; adjust `--muted-foreground` if needed.

## 2. Logo assets

- Overwrite `public/jobion-mark.svg` with the new mark: graphite tile #141518, hairline #2A2D33, silver dotless-j spine (`M38 16v20c0 6.6-5.4 12-12 12-4.9 0-9.1-2.9-11-7`, stroke #E6E8EB, width 6, round caps), electric node circle (44,44 r6) filled with linearGradient `jobion-volt` (#2E6FFF → #6AA2FF).
- Update `src/components/brand/JobionLogo.tsx`:
  - `JobionMark`: inline the same SVG as a React component (accepts `className`, `title`).
  - `JobionMarkMono`: spine + node in `currentColor`, no tile — for footer/watermarks.
  - `JobionWordmark`: Inter 700, tracking -0.03em, `text-foreground` — remove gradient classes.
  - `JobionLogo` / `HeroBrandLockup`: mark + wordmark side-by-side; no gradient text anywhere.
- Regenerate `public/apple-touch-icon.png` (180×180, graphite bg, mark centered) and `public/og-image.png` (1200×630, #0B0C0E bg, mark left, wordmark + "AI-powered tech job matching" right) via imagegen premium.

## 3. `AnimatedJobionMark` + BrandReveal update

- New file `src/components/brand/AnimatedJobionMark.tsx`:
  - `motion.svg` viewBox 0 0 64 64.
  - Silver spine path with `pathLength` variant 0→1, duration 0.7s, easeInOut.
  - Electric node `motion.circle` fill=`url(#jobion-volt)`, spring in at 0.6s delay (bounce 0.45), single soft opacity-ring pulse.
  - `useReducedMotion` → render final state immediately.
- Update `src/components/brand/BrandReveal.tsx`:
  - Overlay bg `#0B0C0E` (was `#0A0F14`).
  - Stack `AnimatedJobionMark` (h-20) above `ParticleLogo` wordmark.
  - Keep sessionStorage `jobion:intro-seen`, 1.8s duration, scatter at 1.3s, reduced-motion skip, post-mount activation (hydration-safe).
- Update `src/components/landing/ParticleLogo.tsx` particle palette: 85% `#E6E8EB`, 15% `#2E6FFF` (retire teal→lime gradient stops).
- Update `MiniBrandPending` to use the new `JobionMark`.

## 4. Sweep — retire teal/lime/aurora

Files to touch (from grep):
- `src/components/ui-ext/GradientText.tsx` → convert to plain heavy foreground text (keep component name/API so callers don't break; internally drop the gradient).
- `src/components/landing/AuroraBackground.tsx` → replace with graphite radial vignette + faint deep-blue glow (pure CSS, no shader). Keep the export so imports still resolve.
- `src/components/landing/AntigravitySection.tsx`, `PricingTeaser.tsx`, `pixel-perfect-hero.tsx`, `PixelBackground.tsx`, `rotating-text.css` → replace teal/lime/cyan hex + Tailwind color classes with `primary` / `foreground` / `muted-foreground`.
- Route files (`features`, `employer`, `settings`, `saved`, `admin`, dashboard/*, `__root`, `AuthShell`, `ApplyDialog`) → same swap; ensure electric blue only on: primary CTA, links, focus rings, active nav, ATS ring, logo node.
- Glass panels → flat `bg-card` with `border border-border`; keep `backdrop-blur` only on navbar (`Navbar.tsx`).
- Charts (any recharts usage): graphite grays + `primary` for highlighted series only.

## 5. Meta + head

- `src/routes/__root.tsx`: `theme-color` meta → `#0B0C0E`; ensure favicon link points to new `/jobion-mark.svg`; OG image path unchanged (regenerated content).
- Retire any lingering `apple-mobile-web-app-status-bar-style` color mismatch.

## 6. Verification

- `bun run build` (typecheck + build).
- Playwright screenshots at `/`, `/jobs`, `/features`, `/dashboard`, `/auth` in dark + light — confirm no teal/lime, electric blue restricted to CTAs/links/rings.
- `rg -n "teal|lime|#14B8A6|#A3E635|#06B6D4|#0A0F14|aurora" src/` returns zero matches (except the `jobion-volt` gradient id).
- BrandReveal plays once per session; spine draws, node springs, particles scatter; reduced-motion skips.

## Out of scope

- No route/feature changes.
- Particle engine kept; only color palette changes.
- Component APIs preserved (`GradientText`, `AuroraBackground` still exportable) to avoid ripple edits.