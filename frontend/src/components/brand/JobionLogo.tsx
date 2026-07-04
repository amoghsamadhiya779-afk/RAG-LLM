import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedWordmark } from "@/components/brand/AnimatedWordmark";


type LogoProps = {
  to?: string;
  showWordmark?: boolean;
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
};

/**
 * Volt Graphite mark — graphite tile, silver dotless-j spine, single electric node.
 * The node is the ONLY accent color allowed on the logo.
 */
export function JobionMark({ className, title = "jOBiON" }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("block h-10 w-10 shrink-0", className)}
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id="jobion-volt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2E6FFF" />
          <stop offset="1" stopColor="#6AA2FF" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="64" height="64" rx="14" fill="#141518" />
      <rect x="0.5" y="0.5" width="63" height="63" rx="13.5" fill="none" stroke="#2A2D33" />
      <path
        d="M38 16v20c0 6.6-5.4 12-12 12-4.9 0-9.1-2.9-11-7"
        stroke="#E6E8EB"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="44" cy="44" r="6" fill="url(#jobion-volt)" />
    </svg>
  );
}

/**
 * Monochrome variant — spine + node both `currentColor`, no tile.
 * Use for footer wordmarks, watermarks, and empty-state accents.
 */
export function JobionMarkMono({ className, title = "jOBiON" }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("block h-10 w-10 shrink-0", className)}
      role="img"
      aria-label={title}
      fill="none"
    >
      <path
        d="M38 16v20c0 6.6-5.4 12-12 12-4.9 0-9.1-2.9-11-7"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="44" cy="44" r="6" fill="currentColor" />
    </svg>
  );
}

export function JobionWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "select-none text-sm font-bold tracking-[-0.03em] text-foreground sm:text-base",
        className,
      )}
    >
      jOBiON
    </span>
  );
}

export function JobionLogo({
  to = "/",
  showWordmark = true,
  className,
  markClassName,
  wordmarkClassName,
}: LogoProps) {
  return (
    <Link
      to={to}
      aria-label="jOBiON home"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-full outline-none transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring/60",
        className,
      )}
    >
      <JobionMark className={markClassName} />
      {showWordmark ? <JobionWordmark className={wordmarkClassName} /> : null}
    </Link>
  );
}

export function HeroBrandLockup({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn("inline-flex items-center gap-3", className)}
    >
      <JobionMark className="h-14 w-14" />
      <AnimatedWordmark className="text-2xl sm:text-3xl" />
    </motion.div>
  );
}

