import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ParticleTextEffect } from "@/components/ui/particle-text-effect";

const WORDS = ["jOBiON"];

export function IntroReveal({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (reduce) return;
    if (typeof window === "undefined") return;
    const seen = sessionStorage.getItem("jobion-intro-seen");
    if (!seen) setShowIntro(true);
  }, [reduce]);

  // Safety net: no matter what happens inside the particle animation,
  // guarantee the fullscreen overlay unmounts so it can't trap clicks.
  useEffect(() => {
    if (!showIntro) return;
    const t = setTimeout(() => {
      try {
        sessionStorage.setItem("jobion-intro-seen", "1");
      } catch {}
      setShowIntro(false);
    }, 6000);
    return () => clearTimeout(t);
  }, [showIntro]);

  const finish = () => {
    try {
      sessionStorage.setItem("jobion-intro-seen", "1");
    } catch {}
    setShowIntro(false);
  };

  return (
    <>
      <AnimatePresence>
        {showIntro && (
          <motion.div
            key="jobion-intro"
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ backgroundColor: "#0A0F14" }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(14px)", scale: 1.04 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <ParticleTextEffect
              words={WORDS}
              loop={false}
              onComplete={finish}
            />
            <button
              type="button"
              onClick={finish}
              className="absolute bottom-8 right-8 text-xs uppercase tracking-widest text-white/50 transition-colors hover:text-white"
            >
              Skip
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
