import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { JobCard } from "@/components/site/job-card";
import { api } from "@/services/api";
import type { JobType, JobLevel } from "@/types";

const ALL_TAGS = ["TypeScript", "React", "Next.js", "Go", "Rust", "Python", "PyTorch", "Postgres", "Kubernetes", "OpenTelemetry", "WebGL", "OSS", "DevRel"];
const TYPES: { v: JobType; label: string }[] = [
  { v: "full_time", label: "Full-time" },
  { v: "part_time", label: "Part-time" },
  { v: "contract", label: "Contract" },
  { v: "internship", label: "Internship" },
];
const LEVELS: JobLevel[] = ["intern", "junior", "mid", "senior", "staff", "principal"];

type SearchParams = { q?: string };

export const Route = createFileRoute("/jobs")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({ q: typeof s.q === "string" ? s.q : undefined }),
  head: () => ({
    meta: [
      { title: "Browse tech jobs — jOBiON" },
      { name: "description", content: "Browse open roles from teams hiring engineers, designers, and ML." },
    ],
  }),
  component: BrowseJobs,
});

function BrowseJobs() {
  const { q: initialQ } = Route.useSearch();
  const [query, setQuery] = useState(initialQ ?? "");
  const [tags, setTags] = useState<string[]>([]);
  const [remote, setRemote] = useState(false);
  const [jobType, setJobType] = useState<JobType | undefined>();
  const [level, setLevel] = useState<JobLevel | undefined>();
  const [salaryMin, setSalaryMin] = useState(0);

  const filters = useMemo(() => ({
    tags: tags.length ? tags : undefined,
    remote: remote || undefined,
    jobType,
    level,
    salaryMin: salaryMin > 0 ? salaryMin * 1000 : undefined,
  }), [tags, remote, jobType, level, salaryMin]);

  const { data: listed, isLoading: loadingList } = useQuery({
    queryKey: ["jobs", "list", filters],
    queryFn: () => api.jobs.list(filters, 1, 50),
    enabled: !query.trim(),
  });

  const { data: searched, isLoading: loadingSearch } = useQuery({
    queryKey: ["jobs", "search", query],
    queryFn: () => api.jobs.search(query),
    enabled: !!query.trim(),
  });

  const results = query.trim() ? searched ?? [] : listed?.items ?? [];
  const loading = query.trim() ? loadingSearch : loadingList;

  const toggleTag = (t: string) => setTags((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]);
  const clearAll = () => { setTags([]); setRemote(false); setJobType(undefined); setLevel(undefined); setSalaryMin(0); setQuery(""); };

  return (
    <div className="min-h-dvh flex flex-col">
      <SiteHeader />
      <main className="flex-1 container-page py-10">
        <div className="mb-6 flex items-center gap-3 rounded-pill border border-bone/10 bg-char px-4 py-2 shadow-sm">
          <Search className="ml-2 h-5 w-5 text-mist" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search "react remote senior" or "ML internship"'
            className="border-0 !bg-transparent text-[16px] text-bone placeholder:text-fog focus-visible:ring-0 px-0 h-10 flex-1"
            aria-label="Search jobs"
            style={{ backgroundColor: "transparent" }}
          />
          {(query || tags.length || remote || jobType || level || salaryMin > 0) ? (
            <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1 rounded-pill"><X className="h-3.5 w-3.5" />Clear</Button>
          ) : null}
        </div>

        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </div>

            <div>
              <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">Stack</div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_TAGS.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTag(t)}
                    className={`rounded-pill px-3 py-1 text-xs transition-colors ${tags.includes(t) ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={remote} onCheckedChange={(v) => setRemote(!!v)} />
              Remote only
            </label>

            <div>
              <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">Type</div>
              <div className="flex flex-wrap gap-1.5">
                {TYPES.map((t) => (
                  <button
                    key={t.v}
                    onClick={() => setJobType(jobType === t.v ? undefined : t.v)}
                    className={`rounded-pill px-3 py-1 text-xs ${jobType === t.v ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
                  >{t.label}</button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">Level</div>
              <div className="flex flex-wrap gap-1.5">
                {LEVELS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(level === l ? undefined : l)}
                    className={`rounded-pill px-3 py-1 text-xs capitalize ${level === l ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
                  >{l}</button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-xs uppercase text-muted-foreground">
                <span>Min salary</span>
                <span className="text-primary">${salaryMin}k+</span>
              </div>
              <Slider value={[salaryMin]} onValueChange={(v) => setSalaryMin(v[0])} min={0} max={300} step={10} />
            </div>
          </aside>

          <section>
            <div className="mb-4 text-sm text-muted-foreground">
              {loading ? "Searching…" : `${results.length} ${results.length === 1 ? "role" : "roles"}`}
            </div>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass-card h-40 animate-pulse" />)}
              </div>
            ) : results.length === 0 ? (
              <div className="glass-card p-10 text-center text-muted-foreground">
                <p>No roles match your filters.</p>
                <Button variant="outline" className="mt-4" onClick={clearAll}>Clear filters</Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {results.map((j) => <JobCard key={j.id} job={j} />)}
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
