import { createFileRoute, Link } from "@tanstack/react-router";
import { Gauge, FileText, ArrowRight } from "lucide-react";

import { ShrinkNavbar } from "@/components/fx/ShrinkNavbar";
import { GlassPanel } from "@/components/ui-ext/GlassPanel";
import { GradientText } from "@/components/ui-ext/GradientText";
import { Reveal } from "@/components/ui-ext/motion";
import { BackButton } from "@/components/layout/BackButton";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/dashboard_/ats/")({
  staticData: { transition: "fadeRise" },
  head: () => ({
    meta: [
      { title: "ATS Score — jOBiON" },
      {
        name: "description",
        content: "Upload a resume and see how ATS bots score you for any role.",
      },
    ],
  }),
  component: AtsIndex,
});

function AtsIndex() {
  return (
    <div className="min-h-screen bg-transparent text-foreground">
      <ShrinkNavbar />
      <main className="mx-auto max-w-4xl px-4 md:px-6 pt-32 pb-24">
        <BackButton fallback="/dashboard" className="mb-6" />
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
            ATS scoring
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            Beat the <GradientText>bots</GradientText>
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Upload a resume, and we'll score it against real ATS rules —
            keyword coverage, missing skills, and actionable fixes.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Reveal>
            <Link to="/dashboard/resume" className="group block h-full">
              <GlassPanel className="h-full p-6 transition-transform group-hover:-translate-y-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                  <FileText className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-lg font-semibold">Upload a resume</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Start a fresh analysis — upload once, score against every job.
                </p>
                <span className="mt-6 inline-flex items-center gap-1 text-xs font-mono uppercase tracking-[0.2em] text-primary/80 group-hover:text-primary">
                  Upload <ArrowRight className="h-3 w-3" />
                </span>
              </GlassPanel>
            </Link>
          </Reveal>

          <Reveal>
            <Link to="/dashboard" className="group block h-full">
              <GlassPanel className="h-full p-6 transition-transform group-hover:-translate-y-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                  <Gauge className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-lg font-semibold">Recent scores</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Open your dashboard to review previous ATS reports and applications.
                </p>
                <span className="mt-6 inline-flex items-center gap-1 text-xs font-mono uppercase tracking-[0.2em] text-primary/80 group-hover:text-primary">
                  Dashboard <ArrowRight className="h-3 w-3" />
                </span>
              </GlassPanel>
            </Link>
          </Reveal>
        </div>
      </main>
      <Footer />
    </div>
  );
}
