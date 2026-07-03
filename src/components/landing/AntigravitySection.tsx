import { lazy, Suspense, useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/ui-ext";

const Antigravity = lazy(() => import("@/components/ui/antigravity"));

export function AntigravitySection() {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(max-width: 640px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-background py-24 md:py-32">
      {/* Particle field */}
      <div className="absolute inset-0">
        {mounted && !reduce && (
          <Suspense fallback={null}>
            <Antigravity
              count={isMobile ? 900 : 1800}
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
        )}
      </div>

      {/* Fade masks */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, var(--color-background) 85%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />

      {/* Copy */}
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 text-center pointer-events-none">
        <Reveal>
          <h2 className="mt-6 text-balance text-4xl font-semibold tracking-[-0.03em] text-foreground md:text-6xl">
            Jobs that{" "}
            <span className="bg-gradient-to-r from-primary via-primary/70 to-primary bg-clip-text text-transparent">
              gravitate
            </span>{" "}
            toward you
          </h2>
        </Reveal>
        <Reveal>
          <p className="mt-5 max-w-xl text-pretty text-base text-white/60 md:text-lg">
            Move your cursor across the field. It responds — the same way our
            matching engine bends toward your resume signal.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export default AntigravitySection;
