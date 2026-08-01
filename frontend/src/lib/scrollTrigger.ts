import { gsap } from "gsap";
import type { ScrollTrigger as ScrollTriggerType } from "gsap/ScrollTrigger";
import type Lenis from "lenis";

let loadPromise: Promise<{ ScrollTrigger: typeof ScrollTriggerType }> | null = null;

/**
 * Dynamically imports + registers the ScrollTrigger plugin exactly once,
 * shared across every scroll-driven landing section. Keeps ScrollTrigger
 * out of the bundle for routes that never touch it (see vite.config.ts
 * manualChunks — it gets its own "vendor-scrolltrigger" chunk).
 */
export function loadScrollTrigger() {
  if (!loadPromise) {
    loadPromise = import("gsap/ScrollTrigger").then((m) => {
      gsap.registerPlugin(m.ScrollTrigger);
      return { ScrollTrigger: m.ScrollTrigger };
    });
  }
  return loadPromise;
}

let boundLenis: Lenis | null = null;

/**
 * Wires Lenis's scroll events into ScrollTrigger so pinned/scrubbed
 * animations stay in sync with Lenis's smoothed scroll position instead of
 * drifting from it. Idempotent — safe to call from every section's effect,
 * regardless of mount order.
 */
export function bindLenisOnce(lenis: Lenis, ScrollTrigger: typeof ScrollTriggerType) {
  if (boundLenis === lenis) return;
  boundLenis = lenis;
  lenis.on("scroll", ScrollTrigger.update);
}
