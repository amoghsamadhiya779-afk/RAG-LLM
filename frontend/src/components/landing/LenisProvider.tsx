import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import Lenis from "lenis";
import { useDevicePerformance } from "@/hooks/useDevicePerformance";

const LenisContext = createContext<Lenis | null>(null);

/** The active Lenis instance, or null when smooth scroll is disabled
 * (reduced motion / low-tier device) — landing sections use this to sync
 * GSAP ScrollTrigger with Lenis's scroll position. */
export function useLenis() {
  return useContext(LenisContext);
}

export function LenisProvider({ children }: { children: ReactNode }) {
  const { isLowTier } = useDevicePerformance();
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Smooth scroll runs a permanent frame loop and fights native scrolling on
    // touch devices. Native scroll is both cheaper and better there.
    if (isLowTier) return;

    const instance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    setLenis(instance);

    // Drive Lenis off GSAP's ticker (one shared frame loop for scroll +
    // ScrollTrigger + any other gsap animation) instead of a separate
    // requestAnimationFrame loop.
    const tick = (time: number) => {
      instance.raf(time * 1000); // gsap ticker time is in seconds
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, [isLowTier]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
