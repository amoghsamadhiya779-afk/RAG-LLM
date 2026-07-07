import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import { useDevicePerformance } from "@/hooks/useDevicePerformance";

interface Props {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  label?: string;
  className?: string;
}

export function MatchRing({ value, size = 140, stroke = 10, label, className }: Props) {
  const osReduce = useReducedMotion();
  const { isLowTier } = useDevicePerformance();
  const reduce = osReduce || isLowTier;
  const id = useId();
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - clamped / 100);

  return (
    <div className={`relative shrink-0 ${className ?? ""}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 block">
        <defs>
          <linearGradient id={`ring-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#a3e635" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-border/50"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#ring-${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: reduce ? offset : circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: reduce ? 0 : 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-3xl font-semibold tracking-tight tabular-nums">{Math.round(clamped)}</span>
        {label && (
          <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
