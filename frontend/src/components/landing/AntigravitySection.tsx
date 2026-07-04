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
    <section className="relative w-full overflow-hidden bg-background min-h-[100dvh] flex flex-col items-center justify-center z-10">

      {/* Absolute Background Layer */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={null}>
          <Antigravity 
            color="#6aa2ff" 
            count={isMobile ? 150 : 300} 
            autoAnimate={isMobile}
          />
        </Suspense>
      </div>

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
          <p className="mt-5 max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
            Move your cursor across the field. It responds — the same way our
            matching engine bends toward your resume signal.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export default AntigravitySection;
