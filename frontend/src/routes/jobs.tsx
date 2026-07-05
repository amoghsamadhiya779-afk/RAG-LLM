import { GuestBanner } from "@/components/auth/GuestBanner";
import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { infiniteQueryOptions, keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Search, Loader2, Filter } from "lucide-react";
import { z } from "zod";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton, EmptyState, ErrorState, Reveal } from "@/components/ui-ext";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFilters, type JobFilterValue } from "@/components/jobs/JobFilters";
import { listJobs } from "@/lib/api/jobs";
import { searchWeb } from "@/lib/api/search";
import type { EmploymentType, Job, Paginated, Seniority } from "@/lib/api/types";
import { BackButton } from "@/components/layout/BackButton";

const employmentTypeSchema = z.enum(["full_time", "part_time", "contract", "internship"]);
const senioritySchema = z.enum(["intern", "junior", "mid", "senior", "staff", "principal"]);

const searchSchema = z.object({
  q: z.string().optional().default(""),
  remote: z.boolean().optional(),
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
    tags: search.tags.length ? search.tags : undefined,
    salary_min: search.salary || undefined,
    page,
    page_size: PAGE_SIZE,
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
        navigate({ search: (p: typeof search) => ({ ...p, q: qDraft }), replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [qDraft, search.q, navigate]);

  const filterValue: JobFilterValue = useMemo(
    () => ({
      remote: search.remote,
      tags: search.tags,
      salary_min: search.salary,
    }),
    [search],
  );

  const query = useInfiniteQuery(jobsListInfiniteOptions(search));
  const webQuery = useQuery({
    queryKey: ["jobs", "web", search.q],
    queryFn: () => searchWeb(search.q || ""),
    enabled: !!search.q && search.q.length >= 2,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const items = useMemo(() => {
    return query.data?.pages.flatMap((p) => p.items) ?? [];
  }, [query.data]);

  const webItems = webQuery.data?.items ?? [];

  const total = query.data?.pages[0]?.total ?? 0;

  // infinite scroll sentinel
  const sentinel = useRef<HTMLDivElement | null>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  
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

  // Smooth scroll to top of list container when page/filters change, but only if we have data
  useEffect(() => {
    if (query.isFetched && !query.isFetchingNextPage && listContainerRef.current) {
      const topPos = listContainerRef.current.offsetTop - 120;
      if (window.scrollY > topPos) {
        window.scrollTo({ top: topPos, behavior: 'smooth' });
      }
    }
  }, [search]); // Runs when filters/search changes

  function updateFilters(next: Partial<JobFilterValue>) {
    navigate({
      replace: true,
      search: (p: typeof search) => ({
        ...p,
        remote: "remote" in next ? next.remote : p.remote,
        tags: next.tags ?? p.tags,
        salary: next.salary_min ?? p.salary,
      }),
    });
  }

  function resetFilters() {
    navigate({ search: () => ({ q: "", tags: [], salary: 0 }), replace: true });
  }

  return (
    <div className="min-h-screen bg-transparent text-foreground">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 pt-24 pb-12">
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
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-12 w-12 rounded-xl lg:hidden border-border/70 bg-card/50 backdrop-blur shrink-0 p-0">
                <Filter className="h-5 w-5 text-muted-foreground" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh] bg-background">
              <DialogHeader>
                <DialogTitle>Filters</DialogTitle>
              </DialogHeader>
              <div className="mt-4 pb-6">
                <JobFilters value={filterValue} onChange={updateFilters} onReset={resetFilters} />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <div className="hidden lg:block">
            <JobFilters value={filterValue} onChange={updateFilters} onReset={resetFilters} />
          </div>

          <section ref={listContainerRef} className={`transition-opacity duration-300 ${query.isFetching && !query.isFetchingNextPage ? 'opacity-60' : 'opacity-100'}`}>
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
            ) : items.length === 0 && webItems.length === 0 ? (
              <EmptyState
                title="No jobs match your filters"
                description="Try clearing filters or a broader search."
                action={<Button variant="outline" onClick={resetFilters}>Reset filters</Button>}
              />
            ) : (
              <>
                {webQuery.isFetching && !webQuery.isLoading && (
                  <div className="mb-4 text-xs font-medium text-muted-foreground flex items-center gap-2 animate-pulse">
                     <Search className="h-3 w-3" /> Searching the web for "{search.q}"...
                  </div>
                )}
                
                {webQuery.isLoading ? (
                  <div className="mb-10">
                    <h2 className="mb-6 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      <span>From the web</span>
                      <div className="h-px flex-1 bg-border/60" />
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-64 rounded-2xl" />
                      ))}
                    </div>
                  </div>
                ) : webItems.length > 0 ? (
                  <div className="mb-10">
                    <h2 className="mb-6 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      <span>From the web</span>
                      <div className="h-px flex-1 bg-border/60" />
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      {webItems.map((job) => (
                        <JobCard key={job.id} job={job} />
                      ))}
                    </div>
                  </div>
                ) : null}
                
                {items.length > 0 && webItems.length > 0 && (
                  <h2 className="mb-6 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    <span>Curated Roles</span>
                    <div className="h-px flex-1 bg-border/60" />
                  </h2>
                )}

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

