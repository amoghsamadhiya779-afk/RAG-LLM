import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Download, Sparkles, X } from "lucide-react";

import { ShrinkNavbar } from "@/components/fx/ShrinkNavbar";
import { MatchRing } from "@/components/fx/MatchRing";
import { SectionBar } from "@/components/ats/SectionBar";
import { GlassPanel } from "@/components/ui-ext/GlassPanel";
import { GradientText } from "@/components/ui-ext/GradientText";
import { Reveal } from "@/components/ui-ext/motion";
import { QueryBoundary } from "@/components/ui-ext/QueryBoundary";
import { Skeleton } from "@/components/ui-ext/Skeleton";
import { ErrorState } from "@/components/ui-ext/ErrorState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAtsScore } from "@/lib/api/ats";
import type { AtsScore } from "@/lib/api/types";
import { BackButton } from "@/components/layout/BackButton";

export const Route = createFileRoute("/dashboard_/ats/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `ATS Report ${params.id} — jOBiON` },
      { name: "description", content: "AI-powered ATS scoring with keyword coverage and actionable suggestions." },
    ],
  }),
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen grid place-items-center p-6">
      <ErrorState error={error as Error} onRetry={reset} />
    </div>
  ),
  component: AtsReportPage,
});

function AtsReportPage() {
  const { id } = Route.useParams();
  return (
    <div className="min-h-screen bg-background">
      <ShrinkNavbar />
      <main className="mx-auto max-w-6xl px-4 pt-28 pb-24">
        <BackButton fallback="/dashboard" className="mb-6" />
        <Reveal>
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition"
              >
                <ArrowLeft className="size-3.5" /> Dashboard
              </Link>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] md:text-5xl">
                <GradientText>ATS Report</GradientText>
              </h1>
              <p className="mt-1 font-mono text-xs text-muted-foreground">#{id}</p>
            </div>
          </div>
        </Reveal>

        <QueryBoundary fallback={<ReportSkeleton />}>
          <Report id={id} />
        </QueryBoundary>
      </main>
    </div>
  );
}

function Report({ id }: { id: string }) {
  const { data } = useSuspenseQuery({
    queryKey: ["ats", id],
    queryFn: () => getAtsScore(id),
  });

  const onExport = () => exportReport(data);

  return (
    <div className="space-y-6">
      {/* Hero: Ring + Sections + Export */}
      <Reveal>
        <GlassPanel className="p-8 md:p-10">
          <div className="grid gap-10 md:grid-cols-[auto_1fr_auto] md:items-center">
            <div className="flex justify-center md:justify-start">
              <MatchRing value={data.overall} size={180} stroke={12} label="Match" />
            </div>
            <div className="space-y-4">
              <SectionBar label="Keywords" value={data.sections.keywords} />
              <SectionBar label="Experience" value={data.sections.experience} />
              <SectionBar label="Education" value={data.sections.education} />
              <SectionBar label="Formatting" value={data.sections.formatting} />
            </div>
            <div className="flex flex-col gap-2 md:items-end">
              <Button
                onClick={onExport}
                className="bg-[linear-gradient(135deg,#2E6FFF,#4C82FF,#6AA2FF)] text-white hover:opacity-90"
              >
                <Download className="size-4" /> Export
              </Button>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {new Date(data.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          {data.jd_snippet && (
            <p className="mt-6 border-t border-border/40 pt-4 font-mono text-xs text-muted-foreground line-clamp-2">
              {data.jd_snippet}
            </p>
          )}
        </GlassPanel>
      </Reveal>

      <div className="grid gap-6 md:grid-cols-2">
        <Reveal>
          <GlassPanel className="h-full p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-md bg-emerald-500/10 text-emerald-400">
                <Check className="size-3.5" />
              </span>
              <h2 className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Matched keywords
              </h2>
              <Badge variant="secondary" className="ml-auto font-mono">
                {data.matched_keywords.length}
              </Badge>
            </div>
            {data.matched_keywords.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matches detected.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.matched_keywords.map((k) => (
                  <motion.span
                    key={k}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 font-mono text-xs text-emerald-300"
                  >
                    {k}
                  </motion.span>
                ))}
              </div>
            )}
          </GlassPanel>
        </Reveal>

        <Reveal>
          <GlassPanel className="h-full p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-md bg-rose-500/10 text-rose-400">
                <X className="size-3.5" />
              </span>
              <h2 className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Missing skills
              </h2>
              <Badge variant="secondary" className="ml-auto font-mono">
                {data.missing_keywords.length}
              </Badge>
            </div>
            {data.missing_keywords.length === 0 ? (
              <p className="text-sm text-muted-foreground">You covered everything. Nice.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.missing_keywords.map((k) => (
                  <motion.span
                    key={k}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-md border border-rose-500/20 bg-rose-500/5 px-2.5 py-1 font-mono text-xs text-rose-300"
                  >
                    {k}
                  </motion.span>
                ))}
              </div>
            )}
          </GlassPanel>
        </Reveal>
      </div>

      <Reveal>
        <GlassPanel className="p-6 md:p-8">
          <div className="mb-5 flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="size-3.5" />
            </span>
            <h2 className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Actionable suggestions
            </h2>
          </div>
          {data.suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No suggestions right now.</p>
          ) : (
            <ol className="space-y-3">
              {data.suggestions.map((s, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-3 rounded-lg border border-border/40 bg-background/40 p-3"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-[linear-gradient(135deg,#2E6FFF,#4C82FF,#6AA2FF)] font-mono text-[11px] text-white">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed">{s}</p>
                </motion.li>
              ))}
            </ol>
          )}
        </GlassPanel>
      </Reveal>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

function exportReport(data: AtsScore) {
  const lines = [
    `jOBiON ATS Report`,
    `Report ID: ${data.id}`,
    `Resume ID: ${data.resume_id}`,
    data.job_id ? `Job ID: ${data.job_id}` : null,
    `Created: ${new Date(data.created_at).toISOString()}`,
    ``,
    `Overall Match: ${data.overall}%`,
    `- Keywords:   ${data.sections.keywords}%`,
    `- Experience: ${data.sections.experience}%`,
    `- Education:  ${data.sections.education}%`,
    `- Formatting: ${data.sections.formatting}%`,
    ``,
    `Matched Keywords (${data.matched_keywords.length}):`,
    ...data.matched_keywords.map((k) => `  + ${k}`),
    ``,
    `Missing Keywords (${data.missing_keywords.length}):`,
    ...data.missing_keywords.map((k) => `  - ${k}`),
    ``,
    `Suggestions:`,
    ...data.suggestions.map((s, i) => `  ${i + 1}. ${s}`),
    ``,
    data.jd_snippet ? `Job Description Snippet:\n${data.jd_snippet}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ats-report-${data.id}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
