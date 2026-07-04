import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { CountUp } from "@/components/ui-ext/CountUp";

interface KpiCardProps {
  label: string;
  value: number;
  hint?: string;
  icon: ReactNode;
  delta?: string;
  format?: (n: number) => string;
}

export function KpiCard({ label, value, hint, icon, delta, format }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-xl border bg-card p-5"
    >
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-muted-foreground/80">{icon}</div>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
        <CountUp value={value} format={format} />
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {delta && <span className="text-emerald-500 font-medium">{delta}</span>}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
      <div className="pointer-events-none absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-[linear-gradient(135deg,#2E6FFF,#4C82FF,#6AA2FF)] opacity-10 blur-2xl" />
    </motion.div>
  );
}
