import type { Variants } from "framer-motion";

export const EASE = [0.16, 1, 0.3, 1] as const;
const ease = EASE;

export const viewportOnce = { once: true, margin: "-80px" } as const;

export const reveal: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

export const revealStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

export const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

export const softSpring = { type: "spring" as const, stiffness: 180, damping: 22, mass: 0.6 };
export const snapSpring = { type: "spring" as const, stiffness: 380, damping: 28, mass: 0.5 };
