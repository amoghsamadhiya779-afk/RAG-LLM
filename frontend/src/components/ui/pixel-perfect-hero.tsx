import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useReducedMotion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

import { RotatingText } from "@/components/ui/rotating-text";


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
  // Paint hero content immediately (LCP) — no opacity gate.
  const [isLoaded] = useState(true);
  const reducedMotion = useReducedMotion();

  useEffect(() => {}, [reducedMotion]);

  return (
    <section className="relative isolate flex min-h-[100svh] w-full items-center justify-center overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center text-center">
        {eyebrow ? (
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[11px] tracking-widest text-white/70 uppercase backdrop-blur-md transition-all duration-700",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#6AA2FF] shadow-[0_0_10px_#6AA2FF]" />
            {eyebrow}
          </div>
        ) : null}

        <h1
          className={cn(
            "mt-8 select-none font-semibold leading-[0.95] tracking-[-0.04em] transition-all duration-1000",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
          style={{ fontSize: "clamp(2.75rem, 10vw, 8rem)" }}
        >
          <span className="tahoe-glass-text font-serif italic">{word1}</span>
          <br />
          <span className="tahoe-glass-text font-sans font-extrabold">
            {word2}
          </span>
        </h1>

        <div
          className={cn(
            "mt-6 flex items-baseline justify-center gap-3 text-white/90 transition-all duration-1000 delay-150",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
          style={{ fontSize: "clamp(1.25rem, 3vw, 2.25rem)" }}
        >
          <span className="font-sans font-medium tracking-[-0.02em] text-white/70">
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


        <p
          className={cn(
            "mt-8 max-w-2xl text-balance text-base text-white/70 transition-all duration-1000 delay-200 sm:text-lg",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          {description}
        </p>

        <div
          className={cn(
            "mt-10 flex w-full max-w-md flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-center transition-all duration-1000 delay-300",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
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
            className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white/90 backdrop-blur-md transition-colors hover:bg-white/10"
          >
            <Search className="h-4 w-4 opacity-80" />
            <span className="sm:hidden">{secondaryCtaMobile}</span>
            <span className="hidden sm:inline">{secondaryCta}</span>
          </Link>
        </div>

        <div
          className={cn(
            "mt-16 w-full transition-all duration-1000 delay-500",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
        >
          <p className="mb-4 font-mono text-[10px] tracking-[0.25em] text-white/40 uppercase">
            Candidates hired at
          </p>
          <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
            <div className="flex animate-marquee gap-10 whitespace-nowrap">
              {[...HIRING_COMPANIES, ...HIRING_COMPANIES].map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="font-mono text-sm tracking-widest text-white/60 uppercase"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
