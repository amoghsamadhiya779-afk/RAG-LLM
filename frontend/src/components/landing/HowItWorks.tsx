import { memo } from "react";
import { FileText, Sparkles, Send } from "lucide-react";
import { Reveal, StaggerGroup, GlassPanel } from "@/components/ui-ext";

const STEPS = [
  {
    icon: FileText,
    title: "Upload your resume",
    body: "PDF or DOCX. We parse it into structured data — skills, experience, education — in seconds.",
  },
  {
    icon: Sparkles,
    title: "Get your ATS score",
    body: "See exactly what applicant tracking systems will extract, plus AI suggestions tailored to each role.",
  },
  {
    icon: Send,
    title: "Apply with confidence",
    body: "One-click apply to curated tech jobs with a resume version tuned to that job's keywords.",
  },
];

function StepCard({ step, index }: { step: (typeof STEPS)[number]; index: number }) {
  return (
    <GlassPanel className="how-step group relative overflow-hidden p-6">
      <div
        className="absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
        style={{ background: "var(--gradient-brand)" }}
      />
      <div className="relative">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
            style={{ background: "var(--gradient-brand)" }}
          >
            <step.icon className="h-5 w-5" />
          </div>
          <span className="text-xs font-mono text-muted-foreground">0{index + 1}</span>
        </div>
        <h3 className="mt-5 text-xl">{step.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
      </div>
    </GlassPanel>
  );
}

function HowItWorksImpl() {

  return (
    <section id="how" className="relative py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">How it works</p>
          <h2 className="mt-3 text-4xl sm:text-5xl">Three steps to your next role</h2>
          <p className="mt-4 text-muted-foreground">
            Built for engineers, designers, and PMs who are tired of shouting into ATS void.
          </p>
        </Reveal>

        <StaggerGroup className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <StepCard key={s.title} step={s} index={i} />
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}

export const HowItWorks = memo(HowItWorksImpl);
