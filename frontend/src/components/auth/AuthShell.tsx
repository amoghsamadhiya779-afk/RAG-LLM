import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { JobionMark } from "@/components/brand/JobionLogo";
import { GradientText } from "@/components/ui-ext/GradientText";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  brandTagline?: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  brandTagline = "Ship your next role. Zero paywalls, ATS-first.",
}: AuthShellProps) {
  const reduce = useReducedMotion();

  return (
    <div className="relative min-h-[100dvh] bg-transparent text-foreground">
      {/* Ambient aurora */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.28),transparent_65%)] blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(163,230,53,0.22),transparent_65%)] blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.10),transparent_70%)]" />
      </div>

      <Link
        to="/"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-border dark:border-white/10 bg-muted/50 dark:bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-md transition hover:bg-muted dark:hover:bg-white/[0.08] hover:text-foreground sm:left-6 sm:top-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Home
      </Link>

      <div className="relative z-10 mx-auto grid min-h-[100dvh] w-full max-w-6xl grid-cols-1 items-stretch gap-0 px-4 py-8 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-14 lg:py-24">
        {/* Brand panel — hidden on mobile, signature centerpiece on desktop */}
        <motion.aside
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="hidden flex-col justify-between overflow-hidden rounded-3xl border border-border dark:border-white/10 bg-gradient-to-br from-muted/50 dark:from-white/[0.04] via-transparent to-transparent dark:to-white/[0.02] p-10 backdrop-blur-xl lg:flex"
        >
          <div className="flex items-center gap-3">
            <JobionMark className="h-12 w-12" />
            <span className="text-lg font-semibold tracking-[-0.03em]">jOBiON</span>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-full bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.35),transparent_60%)] blur-3xl" />
            <motion.div
              animate={reduce ? undefined : { rotate: 360 }}
              transition={reduce ? undefined : { duration: 40, repeat: Infinity, ease: "linear" }}
              className="relative mx-auto grid h-48 w-48 place-items-center"
            >
              <div className="absolute inset-0 rounded-full border border-border dark:border-white/10" />
              <div className="absolute inset-6 rounded-full border border-border dark:border-white/[0.06]" />
              <div className="absolute inset-12 rounded-full border border-border dark:border-white/[0.04]" />
              <JobionMark className="h-20 w-20" />
            </motion.div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold leading-tight tracking-[-0.03em]">
              <GradientText>{brandTagline}</GradientText>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              One free plan for everyone — save jobs, upload resumes, and run ATS scoring across devices.
            </p>
          </div>
        </motion.aside>

        {/* Auth card */}
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.05 }}
          className="flex items-center justify-center"
        >
          <div
            className={cn(
              "relative w-full max-w-md overflow-hidden rounded-2xl border border-border dark:border-white/10 bg-card dark:bg-white/[0.03] p-6 backdrop-blur-2xl sm:p-8",
              "shadow-[0_20px_80px_-30px_rgba(6,182,212,0.35)]",
            )}
          >
            {/* Brand hairline */}
            <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#2E6FFF,#2E6FFF,#6AA2FF,transparent)]" />

            <div className="mb-6">
              {eyebrow && (
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {eyebrow}
                </p>
              )}
              <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                {typeof title === "string" ? <GradientText>{title}</GradientText> : title}
              </h1>
              {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
            </div>

            {children}

            {footer && <div className="mt-6 border-t border-border pt-5 text-sm">{footer}</div>}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
