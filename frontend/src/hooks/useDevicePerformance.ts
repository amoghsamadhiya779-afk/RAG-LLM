import { useState, useEffect } from "react";

export interface DevicePerformance {
  isMobile: boolean;
  isLowTier: boolean;
  tier: "low" | "high";
}

export function useDevicePerformance(): DevicePerformance {
  const [perf, setPerf] = useState<DevicePerformance>({
    isMobile: false,
    isLowTier: false,
    tier: "high",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect mobile by screen width
    const checkMobile = () => window.matchMedia("(max-width: 768px)").matches;
    const isMobile = checkMobile();

    // Detect low tier hardware (cores < 4 or memory < 4GB)
    // TypeScript doesn't have deviceMemory typed on Navigator by default
    const nav = navigator as Navigator & { deviceMemory?: number };
    const cores = nav.hardwareConcurrency || 4; // fallback
    const memory = nav.deviceMemory || 4; // fallback

    const isLowTierHardware = cores < 4 || memory < 4;
    
    // For our app, we treat all mobiles or low hardware as "low tier" for heavy graphics
    const isLowTier = isMobile || isLowTierHardware;

    setPerf({
      isMobile,
      isLowTier,
      tier: isLowTier ? "low" : "high",
    });

    // Listen for resize to update mobile status
    const handler = () => {
      const mobileNow = checkMobile();
      setPerf((prev) => {
        if (prev.isMobile === mobileNow) return prev;
        const lowTierNow = mobileNow || isLowTierHardware;
        return {
          isMobile: mobileNow,
          isLowTier: lowTierNow,
          tier: lowTierNow ? "low" : "high",
        };
      });
    };

    window.addEventListener("resize", handler, { passive: true });
    return () => window.removeEventListener("resize", handler);
  }, []);

  return perf;
}
