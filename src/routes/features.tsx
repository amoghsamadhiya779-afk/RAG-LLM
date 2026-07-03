import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { ShrinkNavbar } from "@/components/fx/ShrinkNavbar";
import { GradientText } from "@/components/ui-ext/GradientText";
import { Reveal } from "@/components/ui-ext/motion";
import { Footer } from "@/components/landing/Footer";
import { BackButton } from "@/components/layout/BackButton";
import MagicBento, { type BentoCardData } from "@/components/ui/magic-bento";

export const Route = createFileRoute("/features")({
  staticData: { transition: "auroraIris" },
  head: () => ({
    meta: [
      { title: "Features — jOBiON" },
      {
        name: "description",
        content:
          "Every jOBiON feature is free and accessible: curated jobs, AI resume analysis, ATS scoring, application tracking, and free job posting.",
      },
      { property: "og:title", content: "Features — jOBiON" },
      {
        property: "og:description",
        content:
          "No tiers, no paywalls. Every feature is one click away from the floating dock.",
      },
    ],
  }),
  component: FeaturesPage,
});

const JOBION_FEATURES: BentoCardData[] = [
  {
    label: "Signal",
    title: "AI Match",
    description: "Matching engine that reads your resume signal and bends jobs toward you.",
    href: "/jobs",
  },
  {
    label: "Score",
    title: "ATS Score",
    description: "Instant ATS scoring with keyword coverage and missing-skill guidance.",
    href: "/dashboard/ats",
  },
  {
    label: "Rewrite",
    title: "Resume Rewrite",
    description: "Upload, parse, and rewrite your resume in one guided flow.",
    href: "/dashboard/resume",
  },
  {
    label: "Curated",
    title: "Curated Jobs",
    description: "Hand-tuned tech roles across stacks, seniorities, and timezones — updated daily.",
    href: "/jobs",
  },
  {
    label: "Apply",
    title: "One-click Apply",
    description: "Optimistic apply with confetti feedback. No forms to re-fill.",
    href: "/jobs",
  },
  {
    label: "Tracked",
    title: "Saved & Tracked",
    description: "Save, timeline, and status across every application in one place.",
    href: "/saved",
  },
];

function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ShrinkNavbar />

      <main className="overflow-x-hidden pt-32 pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <BackButton fallback="/" className="mb-6" />

          <Reveal className="text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" /> Every feature is free
            </p>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.03em] sm:text-5xl md:text-6xl">
              No plans. No paywalls. <GradientText>Just the tools.</GradientText>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Sign in only when we need <em>your</em> data — to apply, save a job, or upload a resume. Otherwise, everything is one click away from the floating dock.
            </p>
          </Reveal>

          <div className="mt-16">
            <MagicBento
              cards={JOBION_FEATURES}
              glowColor="6, 182, 212"
              enableStars
              enableSpotlight
              enableBorderGlow
              enableTilt
              enableMagnetism
              clickEffect
              particleCount={10}
              spotlightRadius={320}
            />
          </div>

          <Reveal className="mt-20 text-center">
            <p className="text-sm text-muted-foreground">
              Prefer the fast lane? Hit <kbd className="rounded border border-border/60 bg-background/60 px-1.5 py-0.5 font-mono text-[11px]">⌘K</kbd> anywhere to jump to any feature.
            </p>
          </Reveal>
        </div>
      </main>

      <Footer />
    </div>
  );
}
