import { GuestBanner } from "@/components/auth/GuestBanner";
import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { infiniteQueryOptions, keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
import { z } from "zod";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton, EmptyState, ErrorState, Reveal } from "@/components/ui-ext";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFilters, type JobFilterValue } from "@/components/jobs/JobFilters";
import { listJobs } from "@/lib/api/jobs";
import type { EmploymentType, Job, Paginated, Seniority } from "@/lib/api/types";
import { BackButton } from "@/components/layout/BackButton";

const employmentTypeSchema = z.enum(["full_time", "part_time", "contract", "internship"]);
const senioritySchema = z.enum(["intern", "junior", "mid", "senior", "staff", "principal"]);

const searchSchema = z.object({
  q: z.string().optional().default(""),
  remote: z.boolean().optional(),
  type: z.array(employmentTypeSchema).optional().default([]),
  level: z.array(senioritySchema).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  salary: z.number().optional().default(0),
});

type JobsSearch = z.infer<typeof searchSchema>;

const PAGE_SIZE = 9;

// Shared between the route loader (prime) and useInfiniteQuery (subscribe).
// queryKey + queryFn must match exactly or the loader-primed page won't be
// picked up by the component subscription.
function jobsListQueryFn(search: JobsSearch, page: number) {
  return listJobs({
    q: search.q || undefined,
    remote: search.remote,
    employment_type: search.type.length ? search.type : undefined,
    seniority: search.level.length ? search.level : undefined,
    tags: search.tags.length ? search.tags : undefined,
    page,
    limit: PAGE_SIZE,
  });
}

function jobsListInfiniteOptions(search: JobsSearch) {
  return infiniteQueryOptions({
    queryKey: ["jobs", "list", search] as const,
    queryFn: ({ pageParam }: { pageParam: number }) => jobsListQueryFn(search, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last: Paginated<Job>, all: Paginated<Job>[]) => {
      const loaded = all.reduce((n, p) => n + p.items.length, 0);
      return loaded < last.total ? all.length + 1 : undefined;
    },
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}


export const Route = createFileRoute("/jobs")({
  staticData: { transition: "slidePush" },
  head: () => ({
    meta: [
      { title: "Jobs — jOBiON" },
      { name: "description", content: "Search curated tech jobs — filter by type, remote, salary, and tags." },
      { property: "og:title", content: "Jobs — jOBiON" },
      { property: "og:description", content: "Search curated tech jobs on jOBiON." },
    ],
  }),
  validateSearch: (input) => searchSchema.parse(input ?? {}),
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context, deps }) => {
    // Non-blocking prime — page 1 is warm by the time JobsPage subscribes.
    void context.queryClient.prefetchInfiniteQuery({
      ...jobsListInfiniteOptions(deps.search),
      pages: 1,
    });
  },
  component: JobsPage,
});

function JobsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/jobs" });
  const [qDraft, setQDraft] = useState(search.q);

  useEffect(() => setQDraft(search.q), [search.q]);

  // debounce search input into URL
  useEffect(() => {
    const t = setTimeout(() => {
      if (qDraft !== search.q)
        navigate({ search: (p: typeof search) => ({ ...p, q: qDraft }) });
    }, 800);
    return () => clearTimeout(t);
  }, [qDraft, search.q, navigate]);

  const filterValue: JobFilterValue = useMemo(
    () => ({
      remote: search.remote,
      employment_type: search.type,
      seniority: search.level,
      tags: search.tags,
      salary_min: search.salary,
    }),
    [search],
  );

  const query = useInfiniteQuery(jobsListInfiniteOptions(search));

  const items = useMemo(() => {
    const all = query.data?.pages.flatMap((p) => p.items) ?? [];
    if (!search.salary) return all;
    return all.filter((j) => (j.salary_min ?? 0) >= search.salary);
  }, [query.data, search.salary]);

  const total = query.data?.pages[0]?.total ?? 0;

  // infinite scroll sentinel
  const sentinel = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !query.hasNextPage) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !query.isFetchingNextPage) query.fetchNextPage();
      },
      { rootMargin: "400px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [query]);

  function updateFilters(next: Partial<JobFilterValue>) {
    navigate({
      search: (p: typeof search) => ({
        ...p,
        remote: "remote" in next ? next.remote : p.remote,
        type: next.employment_type ?? p.type,
        level: next.seniority ?? p.level,
        tags: next.tags ?? p.tags,
        salary: next.salary_min ?? p.salary,
      }),
    });
  }

  function resetFilters() {
    navigate({ search: () => ({ q: "", type: [], level: [], tags: [], salary: 0 }) });
  }

  return (
    <div className="min-h-screen bg-transparent text-foreground">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <GuestBanner />
        <BackButton fallback="/" className="mb-6" />
        <Reveal className="mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Browse</p>
          <h1 className="mt-3 text-4xl sm:text-5xl">Find your next role</h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            {total > 0 ? `${total.toLocaleString()} live roles` : "Curated tech jobs"} · updated every hour.
          </p>
        </Reveal>

        <div className="mb-8 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={qDraft}
              onChange={(e) => setQDraft(e.target.value)}
              placeholder="Search by title, company, or stack…"
              className="h-12 rounded-xl border-border/70 bg-card/50 pl-10 text-base backdrop-blur"
            />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <JobFilters value={filterValue} onChange={updateFilters} onReset={resetFilters} />

          <section>
            {query.isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-2xl" />
                ))}
              </div>
            ) : query.error ? (
              <ErrorState
                title="Couldn't load jobs"
                error={query.error}
                onRetry={() => { query.refetch(); }}
              />
            ) : items.length === 0 ? (
              <EmptyState
                title="No jobs match your filters"
                description="Try clearing filters or a broader search."
                action={<Button variant="outline" onClick={resetFilters}>Reset filters</Button>}
              />
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>

                <div ref={sentinel} className="mt-10 flex justify-center">
                  {query.isFetchingNextPage ? (
                    <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading more…
                    </div>
                  ) : query.hasNextPage ? (
                    <Button variant="outline" onClick={() => query.fetchNextPage()}>
                      Load more
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">You've reached the end.</p>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
