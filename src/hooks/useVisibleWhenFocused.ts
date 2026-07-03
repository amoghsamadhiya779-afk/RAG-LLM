import { useEffect, useState } from "react";

/**
 * Returns true when the document is currently visible.
 * Wrap WebGL/RAF work with this to pause when the user tabs away —
 * saves battery and prevents runaway shaders on backgrounded tabs.
 */
export function useVisibleWhenFocused(): boolean {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onChange = () => setVisible(document.visibilityState === "visible");
    onChange();
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  return visible;
}
