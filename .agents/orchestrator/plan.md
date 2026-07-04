# Plan - jOBiON Landing Page Background & Theme Upgrade

This plan is created to satisfy the requirements for implementing the dual-background system (Galaxy + Grainient), smooth theme transitions, Google Font "Outfit", and contrast enhancements.

## Milestones & Tasks

### Milestone 1: Setup & Design
- [x] Configure global `PROJECT.md` with new project goals and scope.
- [x] Define steps in `plan.md`.
- [x] Read and document existing frontend components and styling layout.

### Milestone 2: Galaxy Background Integration
- [ ] Mount `GalaxyBackground` fixed behind all landing page sections (on `/` route).
- [ ] Configure `GalaxyBackground` for full-viewport (`position: fixed; inset: 0`).
- [ ] Adjust light mode behavior for `GalaxyBackground` (opacity 0.15, keeping or improving invert filter).
- [ ] Adjust WebGL mouse repel listener so pointer interaction is captured across the whole page.

### Milestone 3: Grainient and Hero Styling
- [ ] Adjust `Grainient` container inside `pixel-perfect-hero.tsx` to be semi-transparent (50/50 visual weight).
- [ ] Ensure `Grainient` only visible inside the hero section boundary.
- [ ] Import Google Font "Outfit" (weights 400, 600, 800) in `src/styles.css` (or `__root.tsx`).
- [ ] Apply "Outfit" heading style to the hero heading `<h1>` in `pixel-perfect-hero.tsx`.
- [ ] Add readable text shadow for dark mode and check contrast/readability for light mode.

### Milestone 4: Smooth Theme Transitions
- [ ] Add CSS transitions (>= 300ms) on `background-color`, `color`, `opacity`, and `filter` on root/body, backgrounds, and hero text.
- [ ] Verify that dark ↔ light mode changes do not cause force-remount on WebGL canvases (uniforms/CSS transitions only).

### Milestone 5: Verification & Quality Assurance
- [ ] Verify `npm run build` exits 0.
- [ ] Verify no new TypeScript errors.
- [ ] Check mouse repulsion across landing page.
- [ ] Verify theme transitions and visual stability on fast toggle.
- [ ] Perform a forensic integrity check.
