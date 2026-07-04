import { useEffect, useState } from "react";
import { animate, useMotionValue, useTransform, motion } from "framer-motion";

export function CountUp({ value, duration = 1.2, format }: { value: number; duration?: number; format?: (n: number) => string }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => (format ? format(v) : Math.round(v).toLocaleString()));
  const [display, setDisplay] = useState(format ? format(0) : "0");

  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: [0.16, 1, 0.3, 1] });
    const unsub = rounded.on("change", setDisplay);
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, duration, mv, rounded]);

  return <motion.span>{display}</motion.span>;
}
