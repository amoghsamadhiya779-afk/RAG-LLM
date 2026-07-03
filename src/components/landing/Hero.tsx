import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { EASE } from "@/lib/motion";
import { MagneticButton } from "./MagneticButton";
import { MatchRing } from "@/components/fx/MatchRing";
import { HeroBrandLockup } from "@/components/brand/JobionLogo";

const HEADLINE = "Find your next role in tech, matched by AI";
const GRADIENT_FROM_WORD = 5; // "matched by AI"

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const wordVariant = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: EASE },
  },
};

const wordReduced = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const blobA = {
  background: "radial-gradient(circle at 30% 30%, #06b6d4, transparent 60%)",
};
const blobB = {
  background: "radial-gradient(circle at 70% 70%, #a3e635, transparent 60%)",
};

const AVATARS = [
  "https://i.pravatar.cc/64?img=12",
  "https://i.pravatar.cc/64?img=32",
  "https://i.pravatar.cc/64?img=47",
  "https://i.pravatar.cc/64?img=58",
];

const LOGOS = ["Vercel", "Stripe", "Linear", "Supabase", "Figma", "Notion"];

export function Hero() {
  const reduce = useReducedMotion();
  const navigate = useNavigate();

  // mouse-parallax on the right-side card stack (desktop only)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), {
    stiffness: 150,
    damping: 20,
  });
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), {
    stiffness: 150,
    damping: 20,
  });
  const stackStyle = { rotateX, rotateY, transformPerspective: 900 };

  const stackRef = useRef<HTMLDivElement>(null);
  function onMove(e: React.MouseEvent) {
    if (reduce) return;
    if (window.matchMedia("(max-width: 1023px)").matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  const words = HEADLINE.split(" ");
  const wv = reduce ? wordReduced : wordVariant;

  return (
    <section className="relative isolate overflow-hidden pt-14 pb-16 sm:pt-24 sm:pb-28 lg:pt-28 lg:pb-36 grain">

      {/* Mesh gradient blobs — landing only */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <div
          className="absolute -top-40 -left-24 h-[520px] w-[520px] rounded-full opacity-40 blur-3xl sm:opacity-50 sm:blur-[120px] aurora-a"
          style={blobA}
        />
        <div
          className="absolute -bottom-40 -right-24 h-[560px] w-[560px] rounded-full opacity-40 blur-3xl sm:opacity-50 sm:blur-[120px] aurora-b"
          style={blobB}
        />
        {/* dot grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            color: "var(--foreground)",
            maskImage:
              "radial-gradient(ellipse at 50% 30%, black 40%, transparent 80%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 sm:gap-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
        {/* LEFT */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-2xl"
        >
          {/* eyebrow */}
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
            style={{
              background: "var(--glass)",
              borderColor: "var(--glass-border)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-70 animate-pulse-glow" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <span className="text-muted-foreground">
              Now indexing <span className="text-foreground font-medium">12,000+</span> tech roles
            </span>
          </motion.div>

          <HeroBrandLockup className="mt-6" />

          {/* headline — split word entrance */}
          <h1
            aria-label={HEADLINE}
            className="mt-5 text-balance text-[clamp(2rem,8vw,4.75rem)] font-semibold leading-[1.05] sm:mt-6 sm:leading-[1.02]"
          >
            {words.map((w, i) => (
              <motion.span
                key={i}
                variants={wv}
                className={
                  i >= GRADIENT_FROM_WORD
                    ? "text-gradient-brand animate-gradient mr-[0.25em] inline-block"
                    : "mr-[0.25em] inline-block"
                }
              >
                {w}
              </motion.span>
            ))}
          </h1>

          {/* subhead */}
          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-xl text-balance text-base text-muted-foreground sm:text-lg"
          >
            Upload your resume and get instantly matched to roles with a real ATS score —
            no more guessing.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:items-center"
          >
            <MagneticButton
              onClick={() => navigate({ to: "/dashboard/resume" })}
              className="w-full justify-center sm:w-auto"
            >
              <Sparkles className="h-4 w-4" />
              <span className="truncate">Upload resume → get matched</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </MagneticButton>
            <MagneticButton
              variant="ghost"
              onClick={() => navigate({ to: "/jobs" })}
              className="w-full justify-center sm:w-auto"
            >
              Browse jobs
            </MagneticButton>
          </motion.div>


          {/* trust row */}
          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-col gap-4 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5"
          >
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {AVATARS.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    loading="lazy"
                    className="h-8 w-8 rounded-full border-2 border-background object-cover"
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-foreground font-medium">3,200+</span> developers hired this month
              </p>
            </div>
            <div className="relative w-full overflow-hidden sm:max-w-md [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
              <div className="flex w-max gap-8 animate-marquee sm:gap-10">
                {[...LOGOS, ...LOGOS].map((n, i) => (
                  <span
                    key={i}
                    className="text-xs uppercase tracking-[0.2em] text-muted-foreground/70"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* RIGHT — parallax card stack */}
        <div
          ref={stackRef}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          className="relative mx-auto h-[340px] w-full max-w-sm sm:h-[440px] sm:max-w-md lg:h-[500px]"
        >

          <motion.div
            style={stackStyle}
            className="relative h-full w-full"
          >
            {/* back card — hidden on mobile */}
            <motion.div
              initial={{ opacity: 0, y: 24, rotate: -6 }}
              animate={{ opacity: 1, y: 0, rotate: -6 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.35 }}
              className="absolute left-2 top-8 hidden w-[85%] rounded-2xl border p-5 shadow-[var(--shadow-elevated)] sm:block"
              style={{
                background: "var(--glass)",
                borderColor: "var(--glass-border)",
                backdropFilter: "blur(14px)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30" />
                <div>
                  <p className="text-sm font-medium">Backend Engineer</p>
                  <p className="text-xs text-muted-foreground">Stripe · Hybrid · $180–220k</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                {["Go", "Postgres", "Kafka"].map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-border/70 px-2 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* front card with match ring */}
            <motion.div
              initial={{ opacity: 0, y: 32, rotate: 4 }}
              animate={{ opacity: 1, y: 0, rotate: 4 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
              className="absolute right-1 top-6 w-[94%] rounded-2xl border p-5 shadow-[var(--shadow-elevated)] animate-float sm:right-2 sm:top-20 sm:w-[90%] sm:p-6"
              style={{
                background: "var(--glass)",
                borderColor: "var(--glass-border)",
                backdropFilter: "blur(14px)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Top match
                  </p>
                  <p className="mt-1 truncate text-base font-semibold leading-tight sm:text-lg">
                    Senior Frontend Engineer
                  </p>
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">Vercel · Remote</p>
                </div>
                <span className="shrink-0 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                  New
                </span>
              </div>

              <div className="mt-4 flex items-center gap-4 sm:mt-5 sm:gap-5">
                <div className="sm:hidden">
                  <MatchRing value={92} size={92} stroke={8} label="match" />
                </div>
                <div className="hidden sm:block">
                  <MatchRing value={92} size={112} stroke={9} label="match" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  {[
                    { k: "Skills", v: "18/20" },
                    { k: "Keywords", v: "94%" },
                    { k: "Seniority", v: "Exact" },
                  ].map((row) => (
                    <div key={row.k} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{row.k}</span>
                      <span className="font-medium tabular-nums">{row.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5 sm:mt-5 sm:gap-2">
                {["React", "TypeScript", "Edge", "Framer Motion"].map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-border/70 px-2 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="mt-16 flex justify-center"
      >
        <div className="flex flex-col items-center gap-1 text-muted-foreground animate-float">
          <span className="text-[10px] uppercase tracking-[0.25em]">Scroll</span>
          <ChevronDown className="h-4 w-4" />
        </div>
      </motion.div>
    </section>
  );
}
