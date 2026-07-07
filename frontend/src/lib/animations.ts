import { Transition } from "framer-motion";

/**
 * Returns an optimized framer-motion transition configuration.
 *
 * For high-tier devices, it returns a buttery smooth spring physics animation.
 * For low-tier devices or mobile, it flattens the physics into a standard hardware-accelerated tween.
 *
 * @param isLowTier - From useDevicePerformance hook
 * @param springOptions - Standard spring physics overrides
 * @returns Framer motion Transition object
 */
export function getOptimizedTransition(
  isLowTier: boolean,
  springOptions: Transition = {}
): Transition {
  if (isLowTier) {
    // Flatten physics to a standard easing curve for low-computation CPUs
    return {
      type: "tween",
      ease: "easeOut",
      duration: 0.3,
      // If delay was provided, preserve it
      ...(springOptions.delay !== undefined && { delay: springOptions.delay as number }),
    };
  }

  // High-tier devices get full physics
  return {
    type: "spring",
    stiffness: 300,
    damping: 30,
    ...springOptions,
  };
}
