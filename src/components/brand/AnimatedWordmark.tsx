import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const letter: Variants = {
  hidden: { opacity: 0, y: "0.6em", filter: "blur(10px)", rotateX: -60 },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    rotateX: 0,
    transition: { duration: 0.7, ease: EASE },
  },
};

type Props = {
  text?: string;
  className?: string;
  accentIndices?: number[];
};

/**
 * Animated jOBiON wordmark — per-character stagger with 3D flip-in,
 * blur clear, and a single electric-blue accent letter.
 */
export function AnimatedWordmark({
  text = "jOBiON",
  className,
  accentIndices = [2, 4], // 'i' and 'N' get the accent — matches mark's node.
}: Props) {
  const reduce = useReducedMotion();
  const chars = text.split("");

  if (reduce) {
    return (
      <span
        className={cn(
          "inline-block select-none font-bold tracking-[-0.04em] text-foreground",
          className,
        )}
      >
        {text}
      </span>
    );
  }

  return (
    <motion.span
      variants={container}
      initial="hidden"
      animate="show"
      className={cn(
        "inline-flex select-none font-bold tracking-[-0.04em] text-foreground",
        "[perspective:800px]",
        className,
      )}
      aria-label={text}
    >
      {chars.map((c, i) => (
        <motion.span
          key={`${c}-${i}`}
          variants={letter}
          className={cn(
            "inline-block will-change-transform",
            accentIndices.includes(i) && "text-[#6AA2FF]",
          )}
          style={{
            textShadow: accentIndices.includes(i)
              ? "0 0 24px rgba(46,111,255,0.35)"
              : undefined,
          }}
        >
          {c}
        </motion.span>
      ))}
    </motion.span>
  );
}
