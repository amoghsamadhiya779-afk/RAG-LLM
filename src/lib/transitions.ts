import type { Variants } from "framer-motion";

export type VariantName =
  | "none"
  | "fadeRise"
  | "zoomFlip"
  | "blurDissolve"
  | "slidePush"
  | "scaleThrough"
  | "perspectiveFlip"
  | "curtainWipe"
  | "auroraIris";

// Each variant defines initial → enter → exit. Only transform / opacity /
// filter / clip-path — GPU-friendly, layout-safe.
export const VARIANTS: Record<VariantName, Variants> = {
  none: {
    initial: { opacity: 0 },
    enter: { opacity: 1 },
    exit: { opacity: 0 },
  },

  fadeRise: {
    initial: { opacity: 0, y: 24 },
    enter: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
  },

  zoomFlip: {
    initial: { opacity: 0, scale: 1.06, rotateX: -8, transformPerspective: 1200 },
    enter: { opacity: 1, scale: 1, rotateX: 0 },
    exit: { opacity: 0, scale: 0.94, rotateX: 8 },
  },

  blurDissolve: {
    initial: { opacity: 0, filter: "blur(14px)", scale: 1.02 },
    enter: { opacity: 1, filter: "blur(0px)", scale: 1 },
    exit: { opacity: 0, filter: "blur(14px)", scale: 0.99 },
  },

  slidePush: {
    initial: { opacity: 0, x: 64 },
    enter: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -64 },
  },

  scaleThrough: {
    initial: { opacity: 0, scale: 0.9 },
    enter: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.12 },
  },

  perspectiveFlip: {
    initial: { opacity: 0, rotateY: 14, transformPerspective: 1400 },
    enter: { opacity: 1, rotateY: 0 },
    exit: { opacity: 0, rotateY: -14 },
  },

  curtainWipe: {
    initial: { clipPath: "inset(0 0 100% 0)" },
    enter: { clipPath: "inset(0 0 0% 0)" },
    exit: { clipPath: "inset(100% 0 0 0)" },
  },

  auroraIris: {
    initial: { clipPath: "circle(0% at 50% 50%)", opacity: 0.7 },
    enter: { clipPath: "circle(150% at 50% 50%)", opacity: 1 },
    exit: { clipPath: "circle(0% at 50% 50%)", opacity: 0.7 },
  },
};

export const DEFAULT_VARIANT: VariantName = "fadeRise";

/** filter: blur() is expensive on mobile/low-power GPUs — swap to a cheaper variant. */
function isLowPowerClient(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(max-width: 768px)").matches ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function getTransitionForPath(pathname: string): VariantName {
  if (pathname === "/") return "fadeRise";
  if (pathname === "/jobs") return "slidePush";
  if (pathname.startsWith("/jobs/")) return "scaleThrough";
  if (pathname.startsWith("/dashboard/resume")) return "curtainWipe";
  if (pathname.startsWith("/dashboard/ats")) return "auroraIris";
  if (pathname.startsWith("/dashboard/applications"))
    return isLowPowerClient() ? "fadeRise" : "blurDissolve";
  if (pathname.startsWith("/dashboard")) return "fadeRise";
  if (pathname.startsWith("/employer")) return "perspectiveFlip";
  if (pathname.startsWith("/features")) return "auroraIris";
  if (pathname.startsWith("/settings")) return "zoomFlip";
  if (pathname.startsWith("/saved")) return "scaleThrough";
  return "fadeRise";
}
