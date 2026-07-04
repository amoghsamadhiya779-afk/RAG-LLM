# Original User Request

## Initial Request — 2026-07-04T18:37:45Z

Implement a Galaxy starfield + Grainient dual-background system for the jOBiON landing page with smooth dark/light theme transitions and a modernized hero font.

Working directory: C:\Users\Lenovo\Desktop\RAG-LLM\frontend
Integrity mode: development

## Architecture Context

This is a React 19 + TanStack Router + Vite 8 app using Tailwind CSS v4 with oklch design tokens. Key files:

| File | Role |
|------|------|
| `src/routes/__root.tsx` | Root layout — wraps all pages in ThemeProvider, already has fixed `DotFieldBackground` (which skips `/` route) |
| `src/routes/index.tsx` | Landing page — renders `<PixelHero />` + lazy below-fold sections |
| `src/components/ui/pixel-perfect-hero.tsx` | Hero section — currently lazy-loads Grainient as its background |
| `src/components/landing/Galaxy.jsx` | WebGL star field shader (OGL) — mouse-responsive with repulsion |
| `src/components/landing/GalaxyBackground.tsx` | Existing wrapper with capability checks + light-mode invert filter |
| `src/components/backgrounds/Grainient.jsx` | WebGL grain-gradient shader (OGL) — currently used in hero |
| `src/components/backgrounds/DotFieldBackground.tsx` | DotField for non-landing pages (already excludes `/`) |
| `src/components/theme/ThemeProvider.tsx` | Toggles `.dark`/`.light` class on `<html>`, stores in localStorage |
| `src/styles.css` | Main CSS — Tailwind v4, oklch color tokens, `:root` and `.dark` blocks |

### Current state
- `DotFieldBackground` already renders for all non-`/` routes (working correctly — leave untouched)
- `GalaxyBackground.tsx` exists but is NOT currently mounted anywhere — it needs to be placed in the landing page
- `Grainient` is lazy-loaded inside `pixel-perfect-hero.tsx` as the hero background
- Theme toggle adds/removes `.dark` class on `<html>` — no CSS `transition` on color properties currently

## Requirements

### R1. Galaxy background — landing page only, full-viewport, mouse-responsive
Mount `GalaxyBackground` as a **`position: fixed; inset: 0;`** element that covers the entire viewport, but **only on the landing page** (`/` route). It must sit behind all landing page sections (hero, how-it-works, featured-jobs, etc.) as a unified backdrop. The existing `DotFieldBackground` already handles non-landing pages — do not modify it.

**Light mode behavior:** Galaxy should be very subtle — nearly invisible, just faint sparkles. The current `GalaxyBackground.tsx` uses `filter: invert(1) hue-rotate(180deg)` for light mode — keep or improve this approach, but significantly reduce opacity in light mode (e.g. `opacity: 0.15`).

### R2. Grainient overlay — hero section only, 50/50 blend
Keep `Grainient.jsx` rendering inside `pixel-perfect-hero.tsx` only. Adjust its container to be semi-transparent so the Galaxy starfield shows through equally (50/50 visual weight). The Grainient should NOT appear outside the hero section.

### R3. Smooth dark ↔ light theme transitions
Add CSS `transition` rules to the root `<html>` and key background elements so toggling dark/light mode produces a smooth cross-fade (≥ 300ms), not a hard flash. This applies to:
- `background-color` and `color` on the root/body
- Galaxy wrapper opacity/filter
- Grainient color props (already theme-aware via props)
- All text colors in the hero

Do NOT use `key={resolvedTheme}` to force-remount WebGL canvases — that destroys the GPU context and causes a flash. Instead, update shader uniforms or CSS properties smoothly.

### R4. Hero font — Google Font "Outfit"
Import **"Outfit"** from Google Fonts (weights 400, 600, 800) and apply it to the hero heading (`<h1>`) in `pixel-perfect-hero.tsx`. The existing `@fontsource/inter` is fine for body text.

The font import should go in `src/styles.css` as a `@font-face` or Google Fonts `@import`, or as a `<link>` in the `__root.tsx` head — whatever approach is cleanest for TanStack Start SSR.

### R5. Hero text contrast and color transitions
Ensure all hero text (heading, subline "for your {role}", description paragraph, CTA buttons) has sufficient contrast against the layered Galaxy+Grainient background in **both** themes:
- **Dark:** Light/white text with subtle text-shadow for readability against stars
- **Light:** Dark graphite text readable against the faint Galaxy + soft Grainient

Font colors must transition smoothly with the theme — use CSS `transition: color 500ms` or similar, not hard swaps.

## Acceptance Criteria

### Visual
- [ ] Galaxy starfield visible behind the **entire** landing page (all sections, not just hero)
- [ ] Galaxy is nearly invisible in light mode (very faint sparkles only)
- [ ] Grainient grain-gradient visible only within the hero `<section>` bounds
- [ ] Galaxy stars visible through the Grainient (roughly 50/50 blend)
- [ ] Mouse movement causes star repulsion effect across the full page
- [ ] Toggling dark ↔ light mode produces a smooth fade (no hard flash, no blank frames)
- [ ] Hero heading uses "Outfit" font, visually distinct from body text
- [ ] Hero text is clearly readable in both dark and light themes

### Technical
- [ ] `npm run build` passes with zero errors
- [ ] No new TypeScript errors introduced
- [ ] Galaxy canvas is `position: fixed` covering the viewport, z-index behind content
- [ ] Grainient is scoped to the hero `<section>` only — not rendered elsewhere
- [ ] Google Font "Outfit" is loaded (via `@import`, `<link>`, or `@fontsource`)
- [ ] No force-remount (`key={theme}`) on WebGL canvas components — uniforms or CSS transitions only
- [ ] `DotFieldBackground` is NOT modified and still works for non-landing pages
- [ ] CSS transitions (≥ 300ms) on `background-color`, `color`, `opacity`, and `filter` for theme-dependent elements

### Verification
- [ ] Run `npm run build` — must exit 0
- [ ] Visual inspection: toggle theme 5 times rapidly — no flash, no crash, no blank frames
- [ ] Visual inspection: scroll full landing page — Galaxy visible behind all sections
- [ ] Visual inspection: move mouse across hero — stars repulse from cursor
