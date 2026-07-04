import { useMemo } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Heart, MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton, ErrorState, Reveal } from "@/components/ui-ext";
import { JobCard } from "@/components/jobs/JobCard";
import { ApplyDialog } from "@/components/jobs/ApplyDialog";
import { getJob, listJobs, saveJob, unsaveJob } from "@/lib/api/jobs";
import type { Job } from "@/lib/api/types";
import { useState } from "react";
import { BackButton } from "@/components/layout/BackButton";

const jobQueryOptions = (id: string) => ({
  queryKey: ["job", id] as const,
  queryFn: () => getJob(id),
  staleTime: 60_000,
});

export const Route = createFileRoute("/jobs/$id")({
  staticData: { transition: "scaleThrough" },
  loader: async ({ params, context }) => {
    try {
      await context.queryClient.ensureQueryData(jobQueryOptions(params.id));
    } catch {
      throw notFound();
    }
  },
  head: ({ params }) => ({
    meta: [
      { title: `Job ${params.id} — jOBiON` },
      { name: "description", content: "Job details and application on jOBiON." },
    ],
  }),
  errorComponent: ({ error, reset }) => (
    <PageShell>
      <ErrorState title="Couldn't load this job" error={error} onRetry={reset} />
    </PageShell>
  ),
  notFoundComponent: () => (
    <PageShell>
      <div className="rounded-2xl border border-border/70 bg-card/40 p-10 text-center">
        <h2 className="text-xl">Job not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The role may have been closed or removed.
        </p>
        <Link to="/jobs" className="mt-6 inline-flex items-center gap-2 text-sm hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to jobs
        </Link>
      </div>
    </PageShell>
  ),
  pendingComponent: () => (
    <PageShell>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-6 h-16 w-full max-w-2xl" />
      <Skeleton className="mt-10 h-96 w-full" />
    </PageShell>
  ),
  component: JobDetail,
});

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent text-foreground">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 pt-24 pb-12">
        <BackButton fallback="/jobs" className="mb-6" />{children}</main>
      <Footer />
    </div>
  );
}

function JobDetail() {
  const { id } = Route.useParams();
  const { data: job } = useSuspenseQuery(jobQueryOptions(id));

  return (
    <PageShell>
      <Link
        to="/jobs"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All jobs
      </Link>

      <motion.header
        layoutId={`job-card-${job.id}`}
        className="mt-6 rounded-3xl border border-border/70 bg-card/50 p-8 backdrop-blur"
      >
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl text-lg font-semibold text-white"
              style={{ background: "var(--gradient-brand)" }}
            >
              {typeof job.company === "string" ? job.company[0] : job.company?.name?.[0] || "?"}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {typeof job.company === "string" ? job.company : job.company?.name || "Unknown"}
              </p>
              <h1 className="mt-1 text-3xl leading-tight sm:text-4xl">{job.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {job.remote ? "Remote" : job.location}
                </span>
                <span className="capitalize">{job.seniority}</span>
                <span className="capitalize">{job.employment_type.replace("_", " ")}</span>
                {job.is_featured && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-0.5">
                    <Sparkles className="h-3 w-3" /> Featured
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SaveButton jobId={job.id} />
            <ApplyDialog job={job} />
          </div>
        </div>

        <SalaryReveal job={job} />

        <div className="mt-6 flex flex-wrap gap-1.5">
          {job.tags.map((t) => (
            <span
              key={t}
              className="rounded-md border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      </motion.header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_280px]">
        <Reveal>
          <article className="prose prose-invert prose-sm max-w-none prose-headings:font-normal prose-h2:mt-0 prose-h2:text-2xl prose-h3:text-lg prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
            <DescriptionMarkdown source={job.description_md} />
          </article>
        </Reveal>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border/70 bg-card/40 p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" /> Company
            </div>
            <p className="mt-3 text-base">
              {typeof job.company === "string" ? job.company : job.company?.name || "Unknown"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {job.remote ? "Distributed / Remote-friendly" : `Based in ${job.location}`}
            </p>
          </div>
        </aside>
      </div>

      <SimilarJobs currentId={job.id} tags={job.tags} />
    </PageShell>
  );
}

function SaveButton({ jobId }: { jobId: string }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      onClick={async () => {
        if (busy) return;
        setBusy(true);
        const next = !saved;
        setSaved(next);
        try {
          if (next) await saveJob(jobId);
          else await unsaveJob(jobId);
        } catch (err) {
          setSaved(!next);
          toast.error(err instanceof Error ? err.message : "Couldn't update saved");
        } finally {
          setBusy(false);
        }
      }}
      className="gap-2"
    >
      <Heart className={`h-4 w-4 transition-all ${saved ? "fill-pink-500 text-primary" : ""}`} />
      {saved ? "Saved" : "Save"}
    </Button>
  );
}

function SalaryReveal({ job }: { job: Job }) {
  const [shown, setShown] = useState(false);
  if (!job.salary_min) return null;
  return (
    <div className="mt-6 flex items-center gap-4">
      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Compensation</span>
      {shown ? (
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg"
        >
          ${(job.salary_min / 1000).toFixed(0)}k – ${(job.salary_max! / 1000).toFixed(0)}k {job.currency}
        </motion.span>
      ) : (
        <button
          type="button"
          onClick={() => setShown(true)}
          className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Reveal salary
        </button>
      )}
    </div>
  );
}

function DescriptionMarkdown({ source }: { source: string }) {
  // Lightweight markdown renderer (headings + lists + paragraphs) — no extra dep.
  const blocks = useMemo(() => source.split(/\n{2,}/), [source]);
  return (
    <>
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) return <h2 key={i}>{block.replace(/^## /, "")}</h2>;
        if (block.startsWith("### ")) return <h3 key={i}>{block.replace(/^### /, "")}</h3>;
        if (block.startsWith("- ")) {
          const items = block.split("\n").map((l) => l.replace(/^-\s*/, ""));
          return (
            <ul key={i}>
              {items.map((it, j) => <li key={j}>{it}</li>)}
            </ul>
          );
        }
        // inline **bold**
        const parts = block.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>
            {parts.map((p, j) =>
              p.startsWith("**") ? <strong key={j}>{p.slice(2, -2)}</strong> : <span key={j}>{p}</span>,
            )}
          </p>
        );
      })}
    </>
  );
}

function SimilarJobs({ currentId, tags }: { currentId: string; tags: string[] }) {
  const q = useQuery({
    queryKey: ["jobs", "similar", tags[0] ?? ""],
    queryFn: () => listJobs({ page: 1, limit: 12 }),
    staleTime: 60_000,
  });
  const items = (q.data?.items ?? [])
    .filter((j) => j.id !== currentId)
    .filter((j) => j.tags.some((t) => tags.includes(t)))
    .slice(0, 3);

  return (
    <section className="mt-16">
      <Reveal className="mb-6 flex items-end justify-between">
        <h2 className="text-2xl">Similar roles</h2>
        <Link to="/jobs" className="text-xs text-muted-foreground hover:text-foreground">
          Browse all →
        </Link>
      </Reveal>
      {q.isLoading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No similar roles right now.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((j) => <JobCard key={j.id} job={j} />)}
        </div>
      )}
    </section>
  );
}
