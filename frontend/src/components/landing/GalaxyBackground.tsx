"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

const Galaxy = lazy(() => import("@/components/landing/Galaxy"));

// Defined ONCE at module level — stable references, no WebGL re-init
const GALAXY_PROPS = {
  focal: [0.5, 0.35] as [number, number],
  starSpeed: 0.3,
  density: 1,
  hueShift: 230,          // pushes star tint toward electric blue
  saturation: 0.25,       // mostly silver, faint blue — Volt Graphite
  glowIntensity: 0.25,
  twinkleIntensity: 0.25,
  rotationSpeed: 0.05,
  mouseInteraction: true,
  mouseRepulsion: true,
  repulsionStrength: 1.5,
  transparent: true,      // graphite #0B0C0E page bg shows through
};

function canRunGalaxy(): boolean {
  if (typeof window === "undefined") return false;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const wideEnough = window.matchMedia("(min-width: 768px)").matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  return finePointer && wideEnough && cores >= 4;
}

export function GalaxyBackground() {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    setEnabled(canRunGalaxy());
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Reduced motion or low-power → CSS vignette placeholder remains
  if (reduce || !enabled) return null;

  return (
    <div
      className="absolute inset-0 -z-10 animate-galaxy-fade-in"
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
