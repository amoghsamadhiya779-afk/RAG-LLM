import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const spineVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.7, ease: "easeInOut" as const },
  },
};

const nodeVariants = {
  hidden: { scale: 0, opacity: 0 },
  show: {
    scale: 1,
    opacity: 1,
    transition: { delay: 0.6, duration: 0.35, type: "spring" as const, bounce: 0.45 },
  },
};

const glowVariants = {
  hidden: { opacity: 0, scale: 0.6 },
  show: {
    opacity: [0, 0.55, 0],
    scale: [0.8, 1.9, 2.4],
    transition: { delay: 0.7, duration: 1.1, ease: "easeOut" as const, times: [0, 0.4, 1] },
  },
};

/**
 * Animated Volt Graphite mark used only inside the BrandReveal overlay.
 * Spine draws (pathLength 0→1) then the electric node springs in with one soft glow pulse.
 * Skipped for reduced motion (renders final state).
 */
export function AnimatedJobionMark({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const state = reduce ? "show" : "show";
  const initial = reduce ? "show" : "hidden";

  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("block", className)}
      role="img"
      aria-label="jOBiON"
      fill="none"
    >
      <defs>
        <linearGradient id="jobion-volt-anim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2E6FFF" />
          <stop offset="1" stopColor="#6AA2FF" />
        </linearGradient>
        <radialGradient id="jobion-volt-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#4C82FF" stopOpacity="0.8" />
          <stop offset="1" stopColor="#4C82FF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <motion.path
        d="M38 16v20c0 6.6-5.4 12-12 12-4.9 0-9.1-2.9-11-7"
        stroke="#E6E8EB"
        strokeWidth="6"
        strokeLinecap="round"
        variants={spineVariants}
        initial={initial}
        animate={state}
      />

      {!reduce ? (
        <motion.circle
          cx="44"
          cy="44"
          r="10"
          fill="url(#jobion-volt-glow)"
          variants={glowVariants}
          initial="hidden"
          animate="show"
        />
      ) : null}

      <motion.circle
        cx="44"
        cy="44"
        r="6"
        fill="url(#jobion-volt-anim)"
        variants={nodeVariants}
        initial={initial}
        animate={state}
      />
    </svg>
  );
}

export default AnimatedJobionMark;
