const SEEN_KEY = "jobion:intro-seen"
let cached: boolean | null = null

// True exactly once per session; also marks the intro as seen.
// Safe to call from any component in any order (result is cached).
export function introWillPlay(): boolean {
  if (cached !== null) return cached
  if (typeof window === "undefined") {
    return true
  }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  cached = !reduce && !sessionStorage.getItem(SEEN_KEY)
  if (cached) sessionStorage.setItem(SEEN_KEY, "1")
  return cached
}

export const INTRO_TOTAL_MS = 2600
// Hero entrance starts BEFORE the overlay is gone - that's the seamlessness
export const HERO_ENTRANCE_DELAY_S = 2.2
