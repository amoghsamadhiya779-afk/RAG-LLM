import type { Variants } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

export const reveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE },
  },
};

export const revealStagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export const cardLift = {
  rest: { y: 0, transition: { duration: 0.2, ease: EASE } },
  hover: { y: -4, transition: { duration: 0.2, ease: EASE } },
};

export const viewportOnce = { once: true, margin: "-80px" } as const;
