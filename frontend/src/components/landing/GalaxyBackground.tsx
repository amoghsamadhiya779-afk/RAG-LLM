import { lazy, Suspense, useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useLocation } from "@tanstack/react-router";
import { useTheme } from "@/components/theme/ThemeProvider";

// Lazy so ogl + shader source only ship when the landing hero mounts.
const Galaxy = lazy(() => import("@/components/landing/Galaxy"));

// Module-level constant — stable references keep the WebGL effect from
// re-initializing on every parent re-render (arrays as inline props would).
const GALAXY_PROPS = {
  focal: [0.5, 0.35] as [number, number],
  rotation: [1.0, 0.0] as [number, number],
  starSpeed: 0.3,
  density: 1,
  hueShift: 230,        // pushes tint toward electric blue
  saturation: 0.25,     // mostly silver — Volt Graphite
  glowIntensity: 0.25,
  twinkleIntensity: 0.25,
  rotationSpeed: 0.05,
  speed: 1.0,
  mouseInteraction: true,
  mouseRepulsion: true,
  repulsionStrength: 3.5, // Increased from 1.5 for stronger sensitivity
  transparent: true,
};

export function GalaxyBackground() {
  const reduce = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const { pathname } = useLocation();
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  if (pathname !== "/" || reduce) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <div
      className="galaxy-theme-wrapper pointer-events-none fixed inset-0 z-0 h-full w-full animate-galaxy-fade-in"
      style={{
        filter: isDark ? "none" : "invert(1) hue-rotate(180deg)",
        opacity: isDark ? 1 : 0.06,
      }}
      aria-hidden="true"
    >
      {tabVisible ? (
        <Suspense fallback={null}>
          <Galaxy {...GALAXY_PROPS} />
        </Suspense>
      ) : null}
    </div>
  );
}

