import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AnimatedJobionMark } from "@/components/brand/AnimatedJobionMark";
import { AnimatedWordmark } from "@/components/brand/AnimatedWordmark";

const SEEN_KEY = "jobion:intro-seen";
const EASE = [0.16, 1, 0.3, 1] as const;
const REVEAL_MS = 1500;

const alreadySeen = () =>
  typeof window !== "undefined" && sessionStorage.getItem(SEEN_KEY) === "1";

const overlayExit = { opacity: 0, transition: { duration: 0.5, ease: EASE } };

export function BrandReveal() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (alreadySeen()) return;
    if (reduce) {
      try { sessionStorage.setItem(SEEN_KEY, "1"); } catch {}
      return;
    }
    setActive(true);
    const t = window.setTimeout(() => {
      try { sessionStorage.setItem(SEEN_KEY, "1"); } catch {}
      setActive(false);
    }, REVEAL_MS);
    return () => window.clearTimeout(t);
  }, [reduce]);

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="brand-reveal"
          exit={overlayExit}
          className="fixed inset-0 z-[100] grid place-items-center bg-[#0B0C0E]"
          aria-hidden="true"
          onClick={() => {
            try { sessionStorage.setItem(SEEN_KEY, "1"); } catch {}
            setActive(false);
          }}
        >
          {/* radial aurora bloom */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: [0, 0.55, 0.25], scale: [0.7, 1.15, 1] }}
            transition={{ duration: 1.4, ease: EASE, times: [0, 0.5, 1] }}
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(600px 400px at 50% 50%, rgba(46,111,255,0.35), transparent 70%)",
            }}
          />
          <div className="relative flex flex-col items-center gap-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <AnimatedJobionMark className="h-20 w-20" />
            </motion.div>
            <AnimatedWordmark className="text-4xl sm:text-5xl" />
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.55 }}
              className="h-px w-40 origin-left bg-gradient-to-r from-transparent via-[#2E6FFF] to-transparent"
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

