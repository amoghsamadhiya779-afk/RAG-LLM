"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, Suspense } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { JobCard } from "@/components/site/job-card";
import { api } from "@/services/api";
import { Parallax } from "@/components/animation/parallax";
import type { JobType, JobLevel } from "@/types";

const ALL_TAGS = ["TypeScript", "React", "Next.js", "Go", "Rust", "Python", "PyTorch", "Postgres", "Kubernetes", "OpenTelemetry", "WebGL", "OSS", "DevRel"];
const TYPES: { v: JobType; label: string }[] = [
  { v: "full_time", label: "Full-time" },
  { v: "part_time", label: "Part-time" },
  { v: "contract", label: "Contract" },
  { v: "internship", label: "Internship" },
];
const LEVELS: JobLevel[] = ["intern", "junior", "mid", "senior", "staff", "principal"];

function JobsSectionContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || searchParams.get("search") || "";
  
  const [query, setQuery] = useState(initialQ);
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
    <div className="container-page relative z-10">
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-display font-bold tracking-tight sm:text-5xl">
          Explore Open <span className="text-gradient-accent">Roles</span>
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Browse engineering roles matched dynamically to your skill stack.
        </p>
      </div>

      <div className="mb-8 flex items-center gap-3 rounded-pill border border-bone/10 bg-[#1d1d1d]/60 px-4 py-2 backdrop-blur-md shadow-sm">
        <Search className="h-5 w-5 text-mist" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search "react remote senior" or "ML internship"'
          className="border-0 !bg-transparent text-[16px] text-bone placeholder:text-fog focus-visible:ring-0 px-0 h-10"
          aria-label="Search jobs"
          style={{ backgroundColor: "transparent" }}
        />
        {(query || tags.length || remote || jobType || level || salaryMin > 0) ? (
          <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1 rounded-pill text-mist hover:text-bone hover:bg-iron/50">
            <X className="h-4 w-4" />Clear filters
          </Button>
        ) : null}
      </div>

      <div className="grid gap-10 xl:grid-cols-[280px_1fr]">
        <aside className="space-y-8 glass-card p-6 h-fit sticky top-24">
          <div className="flex items-center gap-2 text-[16px] font-medium text-paper mb-2">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </div>

          <div>
            <div className="mb-3 text-[12px] font-medium uppercase tracking-wider text-fog">Stack</div>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  className={`rounded-pill px-3 py-1 text-[13px] transition-colors border ${tags.includes(t) ? "bg-paper text-void border-paper font-medium" : "bg-void text-mist border-bone/10 hover:bg-iron/50"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 text-[14px] text-bone cursor-pointer">
            <Checkbox checked={remote} onCheckedChange={(v) => setRemote(!!v)} className="border-bone/20 data-[state=checked]:bg-paper data-[state=checked]:text-void" />
            Remote only
          </label>

          <div>
            <div className="mb-3 text-[12px] font-medium uppercase tracking-wider text-fog">Type</div>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.v}
                  onClick={() => setJobType(jobType === t.v ? undefined : t.v)}
                  className={`rounded-pill px-3 py-1 text-[13px] border ${jobType === t.v ? "bg-paper text-void border-paper font-medium" : "bg-void text-mist border-bone/10 hover:bg-iron/50"}`}
                >{t.label}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 text-[12px] font-medium uppercase tracking-wider text-fog">Level</div>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(level === l ? undefined : l)}
                  className={`rounded-pill px-3 py-1 text-[13px] capitalize border ${level === l ? "bg-paper text-void border-paper font-medium" : "bg-void text-mist border-bone/10 hover:bg-iron/50"}`}
                >{l}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between text-[12px] uppercase tracking-wider text-fog">
              <span>Min salary</span>
              <span className="text-bone">${salaryMin}k+</span>
            </div>
            <Slider value={[salaryMin]} onValueChange={(v) => setSalaryMin(v[0])} min={0} max={300} step={10} className="py-2" />
          </div>
        </aside>

        <section>
          <div className="mb-6 flex items-center justify-between text-[15px] text-mist pb-4 border-b border-bone/[0.06]">
            <span>{loading ? "Searching…" : `${results.length} ${results.length === 1 ? "role" : "roles"}`}</span>
          </div>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass-card h-[160px] animate-pulse bg-char" />)}
            </div>
          ) : results.length === 0 ? (
            <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
              <Search className="h-8 w-8 text-fog mb-4" />
              <h3 className="text-[20px] font-medium text-paper">No roles found</h3>
              <p className="text-[15px] text-mist mt-2 max-w-sm">We couldn't find any roles matching your current filters. Try adjusting your search criteria.</p>
              <Button variant="outline" className="mt-6 rounded-pill border-bone/20 text-bone hover:bg-iron" onClick={clearAll}>Clear filters</Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {results.map((j: any) => <JobCard key={j.id} job={j} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function JobsSection({ className }: { className?: string }) {
  return (
    <section id="jobs" className={`relative py-24 sm:py-32 border-t border-bone/[0.06] overflow-hidden ${className || ""}`}>
      {/* Dimension Gradient Backdrop */}
      <div aria-hidden className="absolute inset-0 -z-20 bg-dawn-wash opacity-50" />
      <Parallax speed={0.6} className="absolute inset-0 -z-10 pointer-events-none">
        <div aria-hidden className="absolute left-1/2 top-[10%] h-[600px] w-[600px] -translate-x-1/2 bg-radial-indigo" />
      </Parallax>
      
      <Suspense fallback={
        <div className="container-page py-10 animate-pulse h-[600px] bg-void rounded-xl border border-bone/10 flex items-center justify-center">
          <div className="text-mist">Loading jobs feed...</div>
        </div>
      }>
        <JobsSectionContent />
      </Suspense>
    </section>
  );
}
