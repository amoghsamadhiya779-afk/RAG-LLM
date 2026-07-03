import { useEffect, useState } from "react";

/**
 * Returns true when we should downgrade heavy visuals:
 *  - Reduced-motion preference set
 *  - Small viewport (mobile / narrow tablets)
 *  - Few logical cores (< 4)
 *  - Data-saver on
 * SSR-safe: defaults to `false` on the server, then re-evaluates on mount.
 */
export function useLowPower(): boolean {
  const [low, setLow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqNarrow = window.matchMedia("(max-width: 768px)");
    const cores =
      (navigator as Navigator & { hardwareConcurrency?: number })
        .hardwareConcurrency ?? 8;
    const saveData =
      (navigator as Navigator & {
        connection?: { saveData?: boolean };
      }).connection?.saveData ?? false;

    const evaluate = () =>
      setLow(mqReduced.matches || mqNarrow.matches || cores < 4 || saveData);

    evaluate();
    mqReduced.addEventListener("change", evaluate);
    mqNarrow.addEventListener("change", evaluate);
    return () => {
      mqReduced.removeEventListener("change", evaluate);
      mqNarrow.removeEventListener("change", evaluate);
    };
  }, []);

  return low;
}
