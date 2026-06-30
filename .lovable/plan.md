# Subframe-style landing page + global theme

Rebuild `/` to match Subframe's structure and polish, swap in DevBoard content, and lock in a global theme so every page inherits the same look. Frontend-only — all data still flows through `src/services/api.ts`.

## 1. Global theme (`src/styles.css` + `__root.tsx`)

- Load **Inter** (400/500/600/700) and **JetBrains Mono** via `<link>` in `__root.tsx` head. Remove any prior display font references.
- Rewrite `@theme` tokens:
  - `--font-sans: "Inter", ...`, `--font-mono: "JetBrains Mono", ...`
  - Light: `--background #FFFFFF`, `--foreground #0A0A0A`, `--muted-foreground #71717A`, `--border #E4E4E7`, `--card #FFFFFF`
  - Dark: `--background #08090A`, `--card #0F1011`, `--foreground #FAFAFA`, `--muted-foreground #A1A1AA`, `--border #1F1F23`
  - `--primary` = foreground (black-on-white / white-on-black button style)
  - `--gradient-accent: linear-gradient(135deg,#6366F1,#8B5CF6,#EC4899)` — reserved for hero glow, "Featured" badge, key highlights only
  - `--radius: 1rem` (rounded-2xl default), soft shadow tokens (`--shadow-sm`, `--shadow-lift`)
- Typography utilities via `@utility`:
  - `.h-display` (tracking -0.035em, leading 1.05, 600/700)
  - `.h-section` (tracking -0.03em, leading 1.1)
  - `.eyebrow` (13px uppercase, tracking 0.08em, muted)
- Keep the existing dark theme on by default but ensure both modes work.
- Add `@media (prefers-reduced-motion: reduce)` overrides that disable transforms/transitions.

## 2. Shared motion + components

- `src/lib/motion.ts` — export `reveal`, `revealStagger`, `cardLift` framer-motion variants with `ease: [0.16, 1, 0.3, 1]`, and a `useReducedMotionSafe()` helper.
- `src/components/site/header.tsx` — make sticky, transparent over hero, blurred/solid on scroll (IntersectionObserver or scrollY listener). Nav: Browse / Companies / Pricing centered; Log in (ghost) + Start for free (solid) right.
- `src/components/site/footer.tsx` — expand to product/company/legal/social columns.
- New presentational components under `src/components/landing/`:
  - `hero.tsx` (animated gradient blob backdrop + grid)
  - `logo-marquee.tsx` (CSS keyframe `translateX` loop, duplicated row, pause-on-hover)
  - `feature-grid.tsx` (reusable 4-up tile grid)
  - `split-feature.tsx` (copy + visual, supports reversed layout)
  - `match-visual.tsx` (staged reveal: search query → 3 ranked job cards with % match badges, pulled from `api.jobs.list`)
  - `pipeline-visual.tsx` (mini kanban columns for employer split)
  - `integrations-row.tsx` (Slack, Greenhouse, Lever, LinkedIn, Stripe — inline SVG wordmarks)
  - `pricing-cards.tsx` (3 tiers, middle elevated with gradient border + "Popular" pill)
  - `faq.tsx` (shadcn Accordion)
  - `cta-band.tsx`

## 3. Rewrite `src/routes/index.tsx`

Render sections in this order, each wrapped in a `motion.section` with `reveal` variants and `whileInView`:

1. Hero — "Find your next role in tech." / "The AI-native job board built for developers." / **Browse Jobs** (solid) + **Post a Job** (ghost) + **▶ Watch demo** text link.
2. Logo marquee — eyebrow "Trusted by teams hiring on DevBoard"; logos from `api.companies.list()`.
3. Feature A — "Search that actually understands you." → 4 tiles: Semantic search, AI matching, Instant resume parsing, One-click apply.
4. Split A — "From search to offer." + `MatchVisual`.
5. Split B (reversed) — "Post once, reach the right engineers." + `PipelineVisual`.
6. Feature B — "AI-native, candidate-first." → 4 tiles: AI assistant, Personalized recs, Skill-gap insights, Smart alerts.
7. Integrations row.
8. Pricing — Free / **Featured $29/job** (highlighted) / Enterprise. Featured CTA wired to `/post`; Enterprise → mailto.
9. FAQ accordion (5 Qs from brief).
10. Final CTA band — "Your next role is one search away." + Browse / Post buttons → Footer.

## 4. Data wiring

- `MatchVisual` pulls 3 jobs from `api.jobs.list({ limit: 3 })`, fakes match % from seed.
- `LogoMarquee` pulls company names from `api.companies.list()`; falls back to initials-in-circle when no logo.
- No new API methods needed. No mock-data shape changes.

## 5. Out of scope

- Browse, job detail, apply, auth, post, dashboard, profile, admin, companies pages are untouched (they keep the new global tokens automatically).
- No real backend, no Stripe wiring (Featured tier links to `/post` flow which already calls `api.billing.featureJob`).

## Technical notes

- TanStack Start route file untouched at path level — only `component` body + `head()` metadata refreshed.
- All scroll-reveal uses `whileInView={{ ...reveal.show }} viewport={{ once: true, margin: "-80px" }}` and short-circuits to instant when `useReducedMotion()` returns true.
- Marquee animation in CSS (`@keyframes marquee`) rather than JS for perf; `animation-play-state: paused` on hover.
- Sticky nav uses `position: sticky; top: 0` + a `data-scrolled` attribute toggled past 16px scrollY for the backdrop-blur swap.
- Gradient accent class `.text-gradient-accent` / `.bg-gradient-accent` defined once in `styles.css`; used ≤4 places on the landing only.
