import { motion } from "framer-motion";

interface ProfileRingProps {
  percent: number;
  missing: string[];
}

export function ProfileRing({ percent, missing }: ProfileRingProps) {
  const size = 160;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.max(0, Math.min(100, percent)) / 100) * c;

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id="profile-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2E6FFF" />
              <stop offset="50%" stopColor="#4C82FF" />
              <stop offset="100%" stopColor="#6AA2FF" />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="url(#profile-grad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-semibold tabular-nums">{Math.round(percent)}%</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Complete</div>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">Profile completeness</div>
        <p className="text-xs text-muted-foreground mt-1">
          {missing.length === 0 ? "You're all set." : "Finish these to increase your match quality:"}
        </p>
        <ul className="mt-3 space-y-1.5 text-sm">
          {missing.slice(0, 4).map((m) => (
            <li key={m} className="flex items-center gap-2 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-[linear-gradient(135deg,#2E6FFF,#6AA2FF)]" />
              {m}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
