import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AnimatedJobionMark } from "@/components/brand/AnimatedJobionMark";
import { AnimatedWordmark } from "@/components/brand/AnimatedWordmark";
import { useDevicePerformance } from "@/hooks/useDevicePerformance";

/**
 * Dedicated full-screen intro splash — one-time per session.
 * While active, the app content is not rendered; the splash owns the screen.
 * Reduced-motion users skip straight to the app.
 *
 * SSR strategy: both server and client start in "idle" (opaque black cover).
 * useEffect (client-only) then decides whether to play the animated splash
 * or go straight to "done". This avoids hydration mismatches.
 */

const SEEN_KEY = "jobion:intro-seen-v2";
const EASE = [0.16, 1, 0.3, 1] as const;
// Long enough to read the wordmark, short enough not to feel like a gate.
const SPLASH_MS = 1400;

const isBrowser = typeof window !== "undefined";

function alreadySeen() {
  if (!isBrowser) return true;
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {}
}

export function IntroSplash({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const { isLowTier } = useDevicePerformance();
  // Both server and client init to "idle" — guaranteed hydration match.
  // "idle" renders a plain black cover (no animation, no framer-motion).
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");

  useEffect(() => {
    // Low-tier devices pay the splash's animation cost at the exact moment
    // they're also hydrating and compiling shaders — skip straight to the app.
    if (alreadySeen() || reduce || isLowTier) {
      markSeen();
      setPhase("done");
      return;
    }
    // First visit: transition from black cover → animated splash
    setPhase("playing");
    const t = window.setTimeout(() => {
      markSeen();
      setPhase("done");
    }, SPLASH_MS);
    return () => window.clearTimeout(t);
  }, [reduce, isLowTier]);

  const skip = () => {
    markSeen();
    setPhase("done");
  };

  return (
    <>
      {children}
      <AnimatePresence>
        {phase === "idle" ? (
          /* SSR-safe black cover — no animation, no framer-motion deps.
             Covers the page until useEffect fires on hydration. */
          <div
            key="intro-idle"
            className="fixed inset-0 z-[200] bg-[#0B0C0E]"
            aria-hidden
          />
        ) : phase === "playing" ? (
          <motion.div
            key="intro-splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.55, ease: EASE } }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-[#0B0C0E]"
            role="dialog"
            aria-label="jOBiON intro"
          >
            {/* subtle grid + vignette */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #E6E8EB 1px, transparent 1px), linear-gradient(to bottom, #E6E8EB 1px, transparent 1px)",
                backgroundSize: "48px 48px",
                maskImage:
                  "radial-gradient(circle at center, black 30%, transparent 75%)",
              }}
            />
            {/* aurora bloom */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 0.55, 0.3], scale: [0.6, 1.2, 1] }}
              transition={{ duration: 1.1, ease: EASE, times: [0, 0.55, 1] }}
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(700px 480px at 50% 45%, rgba(46,111,255,0.38), transparent 70%)",
              }}
            />

            <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.82, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE }}
              >
                <AnimatedJobionMark className="h-24 w-24 sm:h-28 sm:w-28" />
              </motion.div>

              <AnimatedWordmark className="text-5xl leading-none sm:text-7xl" />

              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.35 }}
                className="h-px w-48 origin-left bg-gradient-to-r from-transparent via-[#2E6FFF] to-transparent"
              />

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.55 }}
                className="max-w-md text-xs uppercase tracking-[0.35em] text-muted-foreground sm:text-sm"
              >
                AI-powered tech job matching
              </motion.p>
            </div>

            {/* Available immediately — never force a wait before letting the user dismiss it. */}
            <motion.button
              type="button"
              onClick={skip}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="absolute bottom-8 right-8 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] uppercase tracking-widest text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground"
            >
              Skip
            </motion.button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

