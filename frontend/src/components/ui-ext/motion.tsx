import { motion, useReducedMotion, type MotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { reducedMotionVariants, reveal, revealStagger } from "@/lib/motion";
import { useDevicePerformance } from "@/hooks/useDevicePerformance";

interface RevealProps extends MotionProps {
  children: ReactNode;
  className?: string;
}

export function Reveal({ children, className, ...rest }: RevealProps) {
  const osReduce = useReducedMotion();
  const { isLowTier } = useDevicePerformance();
  const shouldReduce = osReduce || isLowTier;
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
      variants={shouldReduce ? reducedMotionVariants : reveal}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function StaggerGroup({ children, className, ...rest }: RevealProps) {
  const osReduce = useReducedMotion();
  const { isLowTier } = useDevicePerformance();
  const shouldReduce = osReduce || isLowTier;
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
      variants={shouldReduce ? reducedMotionVariants : revealStagger}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
