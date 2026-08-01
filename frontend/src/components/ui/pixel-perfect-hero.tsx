import React, { Suspense, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { gsap } from "gsap";
import { useReducedMotion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useDevicePerformance } from "@/hooks/useDevicePerformance";
import { useLenis } from "@/components/landing/LenisProvider";
import { bindLenisOnce, loadScrollTrigger } from "@/lib/scrollTrigger";

import { RotatingText } from "@/components/ui/rotating-text";

const LightPillar = React.lazy(() => import("@/components/backgrounds/LightPillar"));

export interface PixelHeroProps {
  word1?: string;
  word2?: string;
  eyebrow?: string;
  description?: string;
  primaryCta?: string;
  primaryCtaMobile?: string;
  secondaryCta?: string;
  secondaryCtaMobile?: string;
  onPrimaryClick?: () => void;
  jobsUrl?: string;
}

const HIRING_COMPANIES = [
  "Vercel",
  "Stripe",
  "Linear",
  "Notion",
  "Ramp",
  "Figma",
  "Datadog",
  "Retool",
];

export function PixelHero({
  word1 = "Matched",
  word2 = "by AI.",
  eyebrow,
  description = "Upload your resume and get instantly matched to tech roles with a real ATS score — no more guessing, no more spraying applications.",
  primaryCta = "Upload resume",
  primaryCtaMobile = "Upload",
  secondaryCta = "Browse jobs",
  secondaryCtaMobile = "Jobs",
  onPrimaryClick,
  jobsUrl = "/jobs",
}: PixelHeroProps) {
  const reducedMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const { isMobile, isLowTier } = useDevicePerformance();
  const lenis = useLenis();

  const isDark = resolvedTheme === "dark";
  const c1 = isDark ? "#284f73" : "#c7ddfd";
  const c2 = isDark ? "#261a57" : "#a9c8fb";

  const sectionRef = useRef<HTMLElement>(null);
  const bgWrapRef = useRef<HTMLDivElement>(null);
  const scrubRef = useRef<HTMLDivElement>(null);

  const enableScrollScrub = !isLowTier && !reducedMotion;

  useEffect(() => {
    if (!enableScrollScrub) return;
    let ctx: gsap.Context | undefined;
    let cancelled = false;

    loadScrollTrigger().then(({ ScrollTrigger }) => {
      if (cancelled || !sectionRef.current) return;
      if (lenis) bindLenisOnce(lenis, ScrollTrigger);

      ctx = gsap.context(() => {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top top",
              end: "bottom top",
              scrub: 0.8,
            },
          })
          .to(scrubRef.current, { yPercent: -18, scale: 0.94, opacity: 0, ease: "none" }, 0)
          .to(bgWrapRef.current, { yPercent: -6, scale: 1.06, ease: "none" }, 0);
      }, sectionRef);
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableScrollScrub, lenis]);

  return (
    <section ref={sectionRef} className="relative isolate flex min-h-[100dvh] w-full items-center justify-center overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div
        ref={bgWrapRef}
        className="absolute inset-0 -z-10"
        style={{
          WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)"
        }}
      >
        <Suspense fallback={null}>
          <LightPillar
            topColor={c1}
            bottomColor={c2}
            intensity={isDark ? 1.0 : 0.95}
            rotationSpeed={0.3}
            glowAmount={isDark ? 0.005 : 0.0035}
            pillarWidth={3.0}
            pillarHeight={0.4}
            noiseIntensity={isDark ? 0.5 : 0.3}
            pillarRotation={0}
            interactive={!isMobile && !isLowTier}
            mixBlendMode="normal"
            quality={isLowTier ? "low" : "high"}
          />
        </Suspense>
      </div>
      
      <div className="hero-reveal relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center text-center">
      <div ref={scrubRef}>
        {eyebrow ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-foreground/5 px-3 py-1 font-mono text-[11px] tracking-widest text-foreground/70 uppercase backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-[#6AA2FF] shadow-[0_0_10px_#6AA2FF]" />
            {eyebrow}
          </div>
        ) : null}

        <h1
          className="font-outfit mt-8 select-none font-extrabold leading-[0.95] tracking-[-0.04em] text-foreground"
          style={{
            fontSize: "clamp(2.75rem, 10vw, 8rem)",
            textShadow: isDark
              ? "0 2px 24px rgba(0,0,0,0.5), 0 0 60px rgba(46,111,255,0.15)"
              : "0 1px 0 rgba(255,255,255,0.7), 0 2px 20px rgba(37,87,230,0.12)",
          }}
        >
          <span className="tahoe-glass-text italic">{word1}</span>
          <br />
          <span className="tahoe-glass-text">
            {word2}
          </span>
        </h1>

        <div
          className="mt-6 flex items-baseline justify-center gap-3 text-foreground/90"
          style={{ fontSize: "clamp(1.25rem, 3vw, 2.25rem)" }}
        >
          <span className="font-sans font-medium tracking-[-0.02em] text-foreground/70">
            for your
          </span>
          {reducedMotion ? (
            <span className="rotating-text--gradient rotating-text--uppercase font-sans font-semibold tracking-[-0.02em]">
              ROLE
            </span>
          ) : (
            <RotatingText
              texts={[
                "role",
                "team",
                "stack",
                "company",
                "culture",
                "salary",
                "mission",
                "people",
              ]}
              rotationInterval={2200}
              staggerDuration={0.025}
              splitBy="characters"
              mainClassName="rotating-text--gradient rotating-text--uppercase font-sans font-semibold tracking-[-0.02em]"
            />
          )}
        </div>


        <p className="mt-8 max-w-2xl text-balance text-base text-foreground/70 sm:text-lg">
          {description}
        </p>

        <div className="mt-10 flex w-full max-w-md flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-center">
          <button
            type="button"
            onClick={onPrimaryClick}
            className="group inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5"
            style={{
              backgroundImage:
                "linear-gradient(135deg,#2E6FFF,#2E6FFF,#6AA2FF)",
            }}
          >
            <span className="sm:hidden">{primaryCtaMobile}</span>
            <span className="hidden sm:inline">{primaryCta}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <Link
            to={jobsUrl}
            className="group inline-flex items-center justify-center gap-2 rounded-xl border border-foreground/15 bg-foreground/5 px-6 py-3 text-sm font-medium text-foreground/90 backdrop-blur-md transition-colors hover:bg-foreground/10"
          >
            <Search className="h-4 w-4 opacity-80" />
            <span className="sm:hidden">{secondaryCtaMobile}</span>
            <span className="hidden sm:inline">{secondaryCta}</span>
          </Link>
        </div>

        <div className="mt-16 w-full">
          <p className="mb-4 font-mono text-[10px] tracking-[0.25em] text-foreground/40 uppercase">
            Candidates hired at
          </p>
          <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
            <div className="flex animate-marquee gap-10 whitespace-nowrap">
              {[...HIRING_COMPANIES, ...HIRING_COMPANIES].map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="font-mono text-sm tracking-widest text-foreground/60 uppercase"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
