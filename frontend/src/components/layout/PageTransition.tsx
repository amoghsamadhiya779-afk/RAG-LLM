import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { EASE } from "@/lib/motion";
import { VARIANTS, getTransitionForPath } from "@/lib/transitions";

const pageTransition = { duration: 0.28, ease: [...EASE] as [number, number, number, number] };

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useRouterState({ select: (s) => s.location });
  const reduce = useReducedMotion();
  const variantName = getTransitionForPath(location.pathname);
  const variants = reduce ? VARIANTS.none : VARIANTS[variantName];
  const key = `${location.pathname}?${location.searchStr ?? ""}`;

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={key}
        variants={variants}
        initial="initial"
        animate="enter"
        exit="exit"
        transition={pageTransition}
        className="min-h-[100dvh] will-change-transform [&[data-motion-exit]]:pointer-events-none"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
