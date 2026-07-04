import { lazy, Suspense, useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
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

function canRunGalaxy() {
  if (typeof window === "undefined") return false;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const wideEnough = window.matchMedia("(min-width: 768px)").matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  return finePointer && wideEnough && cores >= 4;
}

/**
 * Volt Graphite hero background. Renders the OGL Galaxy shader only when
 * the device can handle it AND the tab is visible — otherwise the parent's
 * CSS vignette placeholder stays as-is (that IS the mobile/low-power spec,
 * not a fallback bug).
 */
export function GalaxyBackground() {
  const reduce = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const [enabled, setEnabled] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    setEnabled(canRunGalaxy());
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  if (reduce || !enabled) return null;

  return (
    <div 
      className="absolute inset-0 h-full w-full animate-galaxy-fade-in"
      style={{ filter: resolvedTheme === 'light' ? 'invert(1) hue-rotate(180deg)' : 'none' }}
    >
      {tabVisible ? (
        <Suspense fallback={null}>
          <Galaxy {...GALAXY_PROPS} />
        </Suspense>
      ) : null}
    </div>
  );
}
