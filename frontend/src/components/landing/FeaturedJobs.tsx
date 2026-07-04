import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, MapPin } from "lucide-react";
import { listJobs } from "@/lib/api/jobs";
import { Reveal, Skeleton, ErrorState, EmptyState } from "@/components/ui-ext";
import type { Job } from "@/lib/api/types";

export function FeaturedJobs() {
  const q = useQuery({
    queryKey: ["jobs", "featured"],
    queryFn: () => listJobs({ page: 1, limit: 6 }),
    staleTime: 60_000,
  });

  const featured = (q.data?.items ?? []).filter((j) => j.is_featured).slice(0, 3);
  const list = featured.length > 0 ? featured : (q.data?.items ?? []).slice(0, 3);

  return (
    <section id="jobs" className="relative py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Featured</p>
            <h2 className="mt-3 text-4xl sm:text-5xl">Fresh roles this week</h2>
          </div>
          <a
            href="/jobs"
            className="hidden shrink-0 text-sm text-muted-foreground hover:text-foreground md:inline-flex"
          >
            View all →
          </a>
        </Reveal>

        {q.isLoading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        ) : q.error ? (
          <ErrorState title="Couldn't load jobs" error={q.error} onRetry={() => { q.refetch(); }} />
        ) : list.length === 0 ? (
          <EmptyState title="No featured jobs yet" description="Check back soon." />
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {list.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function JobCard({ job }: { job: Job }) {
  return (
    <a
      href={`/jobs/${job.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-border/70 bg-card/50 p-6 transition-colors hover:border-border"
    >
      {/* glow ring */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 blur transition-opacity duration-500 group-hover:opacity-70"
        style={{ background: "var(--gradient-brand)" }}
      />
      <div className="relative rounded-[15px] bg-card/80 p-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold text-white"
              style={{ background: "var(--gradient-brand)" }}
            >
              {typeof job.company === "string" ? job.company[0] : job.company?.name?.[0] || "?"}
            </div>
            <div>
              <p className="text-sm font-medium">
                {typeof job.company === "string" ? job.company : job.company?.name || "Unknown"}
              </p>
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {job.remote ? "Remote" : job.location}
              </p>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
        <h3 className="mt-5 text-lg leading-snug">{job.title}</h3>
        <div className="mt-5 flex flex-wrap gap-1.5">
          {job.tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded-md border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] text-muted-foreground">
              {t}
            </span>
          ))}
        </div>
        {job.salary_min && (
          <p className="mt-5 text-xs text-muted-foreground">
            ${(job.salary_min / 1000).toFixed(0)}k – ${(job.salary_max! / 1000).toFixed(0)}k · {job.currency}
          </p>
        )}
      </div>
    </a>
  );
}
