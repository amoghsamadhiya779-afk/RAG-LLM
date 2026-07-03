import { Variants } from "framer-motion";

export const EASE = [0.16, 1, 0.3, 1];

export const DURATIONS = {
  fast: 0.15,
  base: 0.2,
  slow: 0.3,
  entrance: 0.5,
};

export const fadeRise: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATIONS.entrance,
      ease: EASE,
    },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const scrollEntranceProps = {
  initial: "hidden",
  whileInView: "visible",
  viewport: { once: true, margin: "-80px" },
};

// Legacy compatibility exports
export const reveal = fadeRise;
export const revealStagger = staggerContainer;
export const viewportOnce = { once: true, margin: "-80px" };
