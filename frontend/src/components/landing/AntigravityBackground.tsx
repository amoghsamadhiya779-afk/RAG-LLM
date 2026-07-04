import { lazy, Suspense, useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useLocation } from "@tanstack/react-router";
import { useTheme } from "@/components/theme/ThemeProvider";

const Antigravity = lazy(() => import("@/components/ui/antigravity"));

export function AntigravityBackground() {
  const reduce = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const { pathname } = useLocation();
  const [tabVisible, setTabVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    
    const mq = window.matchMedia("(max-width: 640px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      mq.removeEventListener("change", onChange);
    };
  }, []);

  if (pathname !== "/" || reduce) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-60"
      style={{
        filter: isDark ? "invert(0) hue-rotate(0deg)" : "invert(1) hue-rotate(180deg)",
        opacity: isDark ? 0.6 : 0.2,
      }}
      aria-hidden="true"
    >
      {tabVisible && mounted ? (
        <Suspense fallback={null}>
          <Antigravity
            count={isMobile ? 1000 : 2500}
            color="#2E6FFF"
            particleShape="sphere"
            particleSize={0.8}
            magnetRadius={5}
            ringRadius={7}
            waveSpeed={0.4}
            waveAmplitude={1}
            lerpSpeed={0.05}
            rotationSpeed={0.05}
            depthFactor={2.1}
            particleVariance={1}
            autoAnimate
          />
        </Suspense>
      ) : null}
    </div>
  );
}
