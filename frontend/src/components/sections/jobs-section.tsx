"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, Suspense } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useSearch } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
 const searchParams = useSearch({ strict: false });
 const initialQ = searchParams["q"] || (searchParams as Record<string, string>)["search"] || "";
 
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

 const FilterContent = (
  <>
   <div className="flex items-center gap-2 text-[16px] font-ui text-paper mb-2">
    <SlidersHorizontal className="h-4 w-4" /> Filters
   </div>

   <div>
    <div className="mb-3 text-[12px] font-ui uppercase tracking-wider text-fog">Stack</div>
    <div className="flex flex-wrap gap-2">
     {ALL_TAGS.map((t) => (
      <button
       key={t}
       onClick={() => toggleTag(t)}
       className={`rounded-pill px-3 py-1 text-[13px] transition-colors border ${tags.includes(t) ? "bg-paper text-void border-paper font-ui" : "bg-void text-mist border-bone/10 hover:bg-iron/50"}`}
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
    <div className="mb-3 text-[12px] font-ui uppercase tracking-wider text-fog">Type</div>
    <div className="flex flex-wrap gap-2">
     {TYPES.map((t) => (
      <button
       key={t.v}
       onClick={() => setJobType(jobType === t.v ? undefined : t.v)}
       className={`rounded-pill px-3 py-1 text-[13px] border ${jobType === t.v ? "bg-paper text-void border-paper font-ui" : "bg-void text-mist border-bone/10 hover:bg-iron/50"}`}
      >{t.label}</button>
     ))}
    </div>
   </div>

   <div>
    <div className="mb-3 text-[12px] font-ui uppercase tracking-wider text-fog">Level</div>
    <div className="flex flex-wrap gap-2">
     {LEVELS.map((l) => (
      <button
       key={l}
       onClick={() => setLevel(level === l ? undefined : l)}
       className={`rounded-pill px-3 py-1 text-[13px] capitalize border ${level === l ? "bg-paper text-void border-paper font-ui" : "bg-void text-mist border-bone/10 hover:bg-iron/50"}`}
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
  </>
 );

 return (
  <div className="container-page relative z-10">
   <div className="mb-12 text-center">
    <h2 className="text-h1 font-display font-display tracking-tight sm:text-display">
     Explore Open <span className="text-gradient-accent">Roles</span>
    </h2>
    <p className="mt-4 text-body-lg text-secondary max-w-2xl mx-auto">
     Browse engineering roles matched dynamically to your skill stack.
    </p>
   </div>

   <div className="relative mx-auto rounded-cards border border-bone/10 bg-char/50 backdrop-blur-md overflow-hidden">
    {/* Window Header */}
    <div className="flex h-12 items-center border-b border-bone/10 bg-graphite/80 px-4">
     <div className="flex gap-2">
      <div className="h-3 w-3 rounded-full border border-red-500/50" style={{ backgroundColor: "rgba(239, 68, 68, 0.8)" }} />
      <div className="h-3 w-3 rounded-full border border-yellow-500/50" style={{ backgroundColor: "rgba(234, 179, 8, 0.8)" }} />
      <div className="h-3 w-3 rounded-full border border-green-500/50" style={{ backgroundColor: "rgba(34, 197, 94, 0.8)" }} />
     </div>
     <div className="flex-1 pr-12 text-center text-[13px] font-ui text-fog font-geist tracking-wide">
      job_search
     </div>
    </div>
    
    {/* Window Body */}
    <div className="p-6 sm:p-8">
     <div className="mb-8 flex flex-col sm:flex-row items-center gap-3 w-full">
      <div className="flex flex-1 w-full items-center gap-3 rounded-pill border border-bone/10 bg-char px-4 py-2 ">
     <Search className="h-5 w-5 text-mist" />
     <Input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder='Search "react remote senior" or "ML internship"'
      className="border-0 !bg-transparent text-[16px] text-bone placeholder:text-fog focus-visible:ring-0 px-0 h-10"
      aria-label="Search jobs"
      style={{ backgroundColor: "transparent" }}
     />
    </div>
    
    <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-2">
     {/* Mobile Filter Trigger */}
     <div className="xl:hidden">
      <Sheet>
       <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 bg-char text-bone border-bone/10 rounded-pill">
         <SlidersHorizontal className="h-4 w-4" /> Filters
        </Button>
       </SheetTrigger>
       <SheetContent side="left" className="w-[300px] sm:w-[350px] bg-void border-r border-bone/10 p-6 overflow-y-auto">
        <SheetHeader className="mb-6 text-left">
         <SheetTitle className="text-bone">Filter Roles</SheetTitle>
        </SheetHeader>
        <div className="space-y-8">
         {FilterContent}
        </div>
       </SheetContent>
      </Sheet>
     </div>
     
     {(query || tags.length || remote || jobType || level || salaryMin > 0) ? (
      <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1 rounded-pill text-mist hover:text-bone hover:bg-iron/50 whitespace-nowrap">
       <X className="h-4 w-4" />Clear all
      </Button>
     ) : null}
    </div>
   </div>

   <div className="grid gap-10 xl:grid-cols-[280px_1fr]">
    <aside className="hidden xl:block space-y-8 glass-card p-6 h-fit sticky top-24">
     {FilterContent}
    </aside>

    <section>
     <div className="mb-6 flex items-center justify-between text-[15px] text-mist pb-4 border-b border-bone/[0.06]">
      <span>{loading ? "Searching…" : `${results.length} ${results.length === 1 ? "role" : "roles"}`}</span>
     </div>
     {loading ? (
      <div className="grid gap-4 md:grid-cols-2">
       {Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass-card h-[160px] animate-pulse bg-char/40" />)}
      </div>
     ) : results.length === 0 ? (
      <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
       <Search className="h-8 w-8 text-fog mb-4" />
       <h3 className="text-[20px] font-ui text-paper">No roles found</h3>
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
    <div className="container-page py-10 animate-pulse h-[600px] bg-void rounded-md border border-bone/10 flex items-center justify-center">
     <div className="text-mist">Loading jobs feed...</div>
    </div>
   }>
    <JobsSectionContent />
   </Suspense>
  </section>
 );
}
