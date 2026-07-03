import { motion, useReducedMotion } from "framer-motion";

interface Props {
  label: string;
  value: number; // 0-100
}

export function SectionBar({ label, value }: Props) {
  const reduce = useReducedMotion();
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
        <span className="font-mono text-sm tabular-nums">{Math.round(v)}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/40">
        <motion.div
          className="h-full rounded-full bg-[linear-gradient(90deg,#2E6FFF,#4C82FF,#6AA2FF)]"
          initial={{ width: reduce ? `${v}%` : 0 }}
          animate={{ width: `${v}%` }}
          transition={{ duration: reduce ? 0 : 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
