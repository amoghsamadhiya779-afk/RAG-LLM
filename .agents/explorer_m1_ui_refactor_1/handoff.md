# Handoff Report: Single Hero Website UI Refactor (M1)

This report outlines the technical investigation and architectural plans for refactoring the jOBiON Next.js frontend into a scrolling "Single Hero Website" layout.

---

## 1. Observation

### Core Pages & Route Structure
We inspected the route files under `frontend/src/app` using `find_by_name`:
- `frontend/src/app/page.tsx` (Homepage)
- `frontend/src/app/jobs/page.tsx` (Browse Jobs page)
- `frontend/src/app/companies/page.tsx` (Companies index page)
- `frontend/src/app/ai-workspace/page.tsx` (AI Workspace page)
- `frontend/src/components/site/header.tsx` (Navbar)

We also observed detail routes such as `/jobs/[id]/page.tsx` and `/companies/[id]/page.tsx` that will remain intact.

### Component Logic & Routing Hooks
1. **`jobs/page.tsx`**: Uses `useSearchParams` to load query terms on mount:
   ```typescript
   // frontend/src/app/jobs/page.tsx:26-28
   function BrowseJobsContent() {
     const searchParams = useSearchParams();
     const initialQ = searchParams.get("q") || searchParams.get("search") || "";
   ```
   To handle Next.js static deoptimization, the component is wrapped in `<Suspense>` at export:
   ```typescript
   // frontend/src/app/jobs/page.tsx:175-181
   export default function BrowseJobs() {
     return (
       <Suspense fallback={<div className="container-page py-10 animate-pulse h-[600px] bg-void rounded-xl" />}>
         <BrowseJobsContent />
       </Suspense>
     );
   }
   ```
2. **`companies/page.tsx`**: A simple React Query integration without routing hook dependencies:
   ```typescript
   // frontend/src/app/companies/page.tsx:8-12
   export default function CompaniesIndex() {
     const { data: companies = [], isLoading } = useQuery({ 
       queryKey: ["companies"], 
       queryFn: () => api.companies.list() 
     });
   ```
3. **`ai-workspace/page.tsx`**: Employs multiple page-specific hooks and dynamic elements:
   - `useHighlightSection()` to trigger element scrolls and flashing highlights.
   - `useRouter()` to push users to detailed job routes:
     ```typescript
     // frontend/src/app/ai-workspace/page.tsx:15-17
     export default function AiWorkspacePage() {
       useHighlightSection();
       const router = useRouter();
     ```
     ```typescript
     // frontend/src/app/ai-workspace/page.tsx:238-241
     <Button className="w-full gap-2" variant="default" onClick={() => router.push(`/jobs/${job.id}`)}>
       <Zap className="h-4 w-4 fill-current" />
       One-click Apply
     </Button>
     ```

### Navigation & Smooth Scrolling
- **`components/site/header.tsx`**: Implements custom routing conditional links:
  ```typescript
  // frontend/src/components/site/header.tsx:16-27
  {pathname === "/" ? (
    <>
      <Link href="#features" className="...">Features</Link>
      <Link href="#use-cases" className="...">Use Cases</Link>
      <Link href="#pricing" className="...">Pricing</Link>
    </>
  ) : (
    <>
      <Link href="/jobs" className="...">Jobs</Link>
      <Link href="/companies" className="...">Companies</Link>
    </>
  )}
  ```
- **`components/animation/smooth-scroll.tsx`**: Uses a GSAP-driven Lenis configuration for smooth scrolling across the entire app except `/dashboard`:
  ```typescript
  // frontend/src/components/animation/smooth-scroll.tsx:26-34
  const lenisInstance = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: "vertical",
    ...
  ```
- **`hooks/use-highlight.ts`**: Handles page-level hash matching and triggers smooth scroll:
  ```typescript
  // frontend/src/hooks/use-highlight.ts:11-20
  const timeout = setTimeout(() => {
    const hash = window.location.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        if (lenis) {
          lenis.scrollTo(element as HTMLElement, { offset: -100 });
        } else {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
  ```

---

## 2. Logic Chain

1. **Static Deoptimization Prevention**:
   - Next.js deoptimizes the entire page to dynamic client-side rendering during production build if `useSearchParams` is used outside of a `<Suspense>` boundary.
   - When we integrate the `JobsSection` into the main landing page (`src/app/page.tsx`), the entire homepage will be subject to build-time deoptimization unless `JobsSection` handles its internal `<Suspense>` encapsulation.
   - *Therefore*: The newly created `src/components/sections/jobs-section.tsx` must wrap its core filtering/listing logic in a `<Suspense>` fallback, just as it was in `jobs/page.tsx`.

2. **Removing Page Wrapper Conflicts**:
   - The standalone routes contain local layout containers, `<SiteHeader />` tags, full screen padding (`min-h-dvh` / `pt-24`), and specific background gradients.
   - In a Single Hero page, the header is rendered globally, and sections flow sequentially.
   - *Therefore*: We must strip `<SiteHeader />` and full-page constraints from the section components, transforming them into modular `<section id="...">` components with standard vertical padding (`py-24 sm:py-32`) and borders (`border-t border-bone/[0.06]`).

3. **Navbar & Hash Navigation Resolution**:
   - The current `SiteHeader` directs users to `/jobs` or `/companies` when on secondary routes, and to `#features` when on `/`.
   - If we refactor to a Single Hero Website, we need navigation links that behave gracefully regardless of the user's current path. If a user is viewing `/dashboard` or `/jobs/[id]`, clicking "Jobs" must navigate them back to the homepage and target the section (`/#jobs`). If they are already on the homepage, clicking "Jobs" should execute a smooth scroll directly to `#jobs` without full-page reloads.
   - *Therefore*: The header must resolve paths dynamically using `pathname === "/" ? "#jobs" : "/#jobs"` while intercepting clicks with `useLenis()` to perform GSAP-driven smooth scrolling.

4. **Universal Hash Highlighting**:
   - The `useHighlightSection` hook is currently loaded in `ai-workspace/page.tsx`.
   - Once the workspace features are merged into the homepage, scroll anchors from the navbar will target multiple sections (`#jobs`, `#companies`, `#ai-workspace`).
   - *Therefore*: The `useHighlightSection` hook should be loaded at the top-level of the homepage (`src/app/page.tsx`), running once on mount/pathname change to handle scroll highlighting for all sections.

---

## 3. Caveats

- **External Detail Pages**: Detail pages like `/jobs/[id]/page.tsx` and `/companies/[id]/page.tsx` will remain active. Because they are standalone, navigating back from them to the homepage sections via hash links will trigger a full browser page transition before executing the `useHighlightSection` scroll.
- **Lenis Context Availability**: The `useLenis` hook depends on the `SmoothScroll` provider rendered in `RootLayout`. If a sub-component is rendered outside of `RootLayout` (e.g., in a test environment or isolated sandbox), `useLenis` will return `null` and fall back to standard `element.scrollIntoView`.

---

## 4. Conclusion

The Single Hero Website refactor is highly feasible and requires:
1. Extracting the page contents into three standalone section components (`jobs-section.tsx`, `companies-section.tsx`, `ai-workspace-section.tsx`).
2. Ensuring `jobs-section.tsx` encapsulates its `<Suspense>` wrapper internally to protect the homepage from static deoptimization.
3. Updating `SiteHeader` to support hybrid path-and-scroll anchors that resolve to `#section` on `/` and to `/#section` on other pages.
4. Moving `useHighlightSection` to the homepage level to allow visual highlighting of all target sections.

---

## 5. Recommended File Outlines

Below are the exact recommended file structures for the refactored components.

### 5.1 `src/components/sections/jobs-section.tsx`
```tsx
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
    <section id="jobs" className="relative text-bone py-24 sm:py-32 border-t border-bone/[0.06] overflow-hidden">
      {/* Dimension Gradient Backdrop */}
      <div aria-hidden className="absolute inset-0 -z-20 bg-dawn-wash opacity-50" />
      <Parallax speed={0.6} className="absolute inset-0 -z-10 pointer-events-none">
        <div aria-hidden className="absolute left-1/2 top-[10%] h-[600px] w-[600px] -translate-x-1/2 bg-radial-indigo" />
      </Parallax>
      
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
            <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1 rounded-pill text-mist hover:text-bone hover:bg-iron/50"><X className="h-4 w-4" />Clear filters</Button>
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

          <div>
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
          </div>
        </div>
      </div>
    </section>
  );
}

export default function JobsSection() {
  return (
    <Suspense fallback={
      <section id="jobs" className="container-page py-24 sm:py-32">
        <div className="animate-pulse h-[600px] bg-char/30 rounded-xl border border-bone/10" />
      </section>
    }>
      <JobsSectionContent />
    </Suspense>
  );
}
```

### 5.2 `src/components/sections/companies-section.tsx`
```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "@/services/api";
import { FadeIn } from "@/components/animation/fade-in";
import { StaggerChildren } from "@/components/animation/stagger";

export default function CompaniesSection() {
  const { data: companies = [], isLoading } = useQuery({ 
    queryKey: ["companies"], 
    queryFn: () => api.companies.list() 
  });
  
  return (
    <section id="companies" className="relative text-bone py-24 sm:py-32 border-t border-bone/[0.06] overflow-hidden">
      <div className="container-page">
        <FadeIn className="mb-12 text-center">
          <h2 className="text-4xl font-display font-bold tracking-tight sm:text-5xl">
            Companies <span className="text-gradient-accent">Hiring</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {companies.length > 0 ? `${companies.length} industry leaders shipping with jOBiON.` : "Discover top companies."}
          </p>
        </FadeIn>

        {isLoading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass-card h-32 animate-pulse" />)}
          </div>
        ) : (
          <StaggerChildren className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((c, i) => (
              <motion.div key={c.id} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <Link href={`/companies/${c.slug || c.id}`} className="glass-card block p-5 transition-colors hover:border-primary/40">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-lg border border-border bg-surface-elevated font-semibold">
                      {c.name[0]}
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold">{c.name}</h3>
                      <p className="text-xs text-muted-foreground">{c.location ?? "Remote"}</p>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{c.about}</p>
                </Link>
              </motion.div>
            ))}
          </StaggerChildren>
        )}
      </div>
    </section>
  );
}
```

### 5.3 `src/components/sections/ai-workspace-section.tsx`
```tsx
"use client";

import { motion } from "framer-motion";
import { Search, Sparkles, FileText, Zap, UploadCloud, Bot, Send } from "lucide-react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JobCard } from "@/components/site/job-card";
import { api } from "@/services/api";
import { toast } from "sonner";
import { FadeIn } from "@/components/animation/fade-in";
import type { JobWithCompany } from "@/types";

export default function AiWorkspaceSection() {
  const router = useRouter();

  // Semantic Search
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<JobWithCompany[]>([]);

  // Resume Parsing
  const [isUploading, setIsUploading] = useState(false);
  const [parsedSkills, setParsedSkills] = useState<string[]>([]);
  const [matchedJobs, setMatchedJobs] = useState<JobWithCompany[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Assistant Chat
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai", text: string }[]>([
    { role: "ai", text: "Hi! I'm the jOBiON AI Assistant. I know all about our open roles. Ask me which jobs fit your profile!" }
  ]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await api.jobs.search(searchQuery);
      setSearchResults(results);
    } catch (e) {
      toast.error("Failed to perform semantic search.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    toast.info("Uploading and parsing resume... This may take a few seconds.");
    
    try {
      const resume = await api.resumes.upload(file);
      const parsed = await api.resumes.parse(resume.id);
      setParsedSkills(parsed.skills || []);
      toast.success("Resume parsed successfully!");

      const recommended = await api.jobs.recommended(resume.id);
      setMatchedJobs(recommended);
      
      if (recommended.length > 0) {
        const matchingEl = document.getElementById("ai-matching");
        if (matchingEl) {
          matchingEl.scrollIntoView({ behavior: "smooth" });
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to process resume.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setChatInput("");
    
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "ai", text: `I found several roles matching "${userMsg}". Check out the semantic search results or upload your resume for a precise match!` }]);
    }, 800);
  };

  return (
    <section id="ai-workspace" className="relative text-bone py-24 sm:py-32 border-t border-bone/[0.06] overflow-hidden">
      <div className="container-page">
        <FadeIn className="mb-12 text-center">
          <h2 className="text-4xl font-display font-bold tracking-tight sm:text-5xl">
            AI <span className="text-gradient-accent">Workspace</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the power of semantic search, instant resume parsing, and personalized AI matching all in one place.
          </p>
        </FadeIn>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Semantic Search */}
          <motion.div 
            id="semantic-search"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Semantic Search</h2>
                <p className="text-sm text-muted-foreground">Find roles using natural language.</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Input 
                placeholder="e.g. 'remote senior react roles on AI teams'" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
            
            <div className="mt-4 flex-1 rounded-md border border-dashed border-border bg-muted/30 p-4 overflow-y-auto max-h-[300px]">
              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map(j => (
                    <JobCard key={j.id} job={j} />
                  ))}
                </div>
              ) : isSearching ? (
                <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground animate-pulse">
                  Searching vector database for: "{searchQuery}"...
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground text-center">
                  Try searching for a job role in plain English.
                </div>
              )}
            </div>
          </motion.div>

          {/* Resume Parsing */}
          <motion.div 
            id="resume-parsing"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Instant Resume Parsing</h2>
                <p className="text-sm text-muted-foreground">Extract skills and experience instantly.</p>
              </div>
            </div>
            
            <input 
              type="file" 
              accept=".pdf"
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            
            <div className="flex flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed border-border bg-muted/30 p-10 text-center transition-colors hover:bg-muted/50">
              <UploadCloud className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">PDF (max. 5MB)</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                {isUploading ? "Uploading..." : "Select Resume"}
              </Button>
            </div>

            {parsedSkills.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Extracted Skills:</h3>
                <div className="flex flex-wrap gap-1.5">
                  {parsedSkills.map((s, i) => (
                    <span key={i} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* AI Matching */}
          <motion.div 
            id="ai-matching"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">AI Matching & One-Click Apply</h2>
                <p className="text-sm text-muted-foreground">See how your parsed profile matches with live jobs.</p>
              </div>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {matchedJobs.length > 0 ? (
                matchedJobs.map((job) => (
                  <div key={job.id} className="flex flex-col rounded-lg border border-primary/40 bg-surface/40 p-5 shadow-[0_0_15px_rgba(var(--primary),0.1)] hover:shadow-[0_0_20px_rgba(var(--primary),0.2)] transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="h-10 w-10 rounded bg-primary/20 flex items-center justify-center font-bold text-primary">
                        {job.company?.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
                        {Math.floor(Math.random() * (99 - 85 + 1) + 85)}% Match
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg line-clamp-1">{job.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-4">{job.company?.name}</p>
                    
                    <div className="mt-auto">
                      <Button className="w-full gap-2" variant="default" onClick={() => router.push(`/jobs/${job.id}`)}>
                        <Zap className="h-4 w-4 fill-current" />
                        One-click Apply
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                [1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col rounded-lg border border-border bg-background p-5 opacity-50 grayscale">
                    <div className="flex items-start justify-between mb-2">
                      <div className="h-10 w-10 rounded bg-muted/50" />
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        --% Match
                      </span>
                    </div>
                    <div className="mt-2 h-4 w-3/4 rounded bg-muted/50" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-muted/50" />
                    
                    <div className="mt-6">
                      <Button className="w-full gap-2" variant="outline" disabled>
                        Upload Resume First
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Chat Assistant */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border border-border bg-card p-0 shadow-sm lg:col-span-2 overflow-hidden flex flex-col min-h-[400px]"
          >
            <div className="flex items-center gap-3 p-6 border-b border-border/50 bg-surface/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">AI Assistant</h2>
                <p className="text-sm text-muted-foreground">Chat with the open-roles index.</p>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[300px] bg-muted/10">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-surface border border-border text-foreground"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleChat} className="p-4 border-t border-border/50 bg-background flex gap-2">
              <Input 
                placeholder="e.g. Can you find me jobs that require Python and allow remote work?"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
```

### 5.4 `src/app/page.tsx` (Integrated Homepage)
```tsx
"use client";

import { SiteHeader } from "@/components/site/header";
import { Hero } from "@/components/landing/hero";
import { Search, Sparkles, FileText, Bot, Compass, Briefcase } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/animation/fade-in";
import { StaggerChildren } from "@/components/animation/stagger";
import { ScrollReveal } from "@/components/animation/scroll-reveal";
import { Parallax } from "@/components/animation/parallax";

// Extracted standalone sections
import JobsSection from "@/components/sections/jobs-section";
import CompaniesSection from "@/components/sections/companies-section";
import AiWorkspaceSection from "@/components/sections/ai-workspace-section";

import { useHighlightSection } from "@/hooks/use-highlight";

export default function LandingPage() {
  // Activate highlight / smooth scroll on hash matches across all sections
  useHighlightSection();

  return (
    <div className="min-h-dvh bg-void text-bone font-sans">
      <SiteHeader />
      
      <main className="relative z-10 bg-void">
        <Hero />
        
        {/* Features Section */}
        <section id="features" className="container-page py-24 sm:py-32">
          <FadeIn className="mb-16">
            <h2 className="font-geist text-[32px] font-semibold text-paper">
              Search that actually<br />understands you.
            </h2>
            <p className="mt-4 text-[18px] text-mist max-w-xl">
              Forget keyword roulette. We read job descriptions the way you read them — and rank them by what you've actually shipped.
            </p>
          </FadeIn>

          <StaggerChildren className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Search, title: "Semantic search", desc: "Ask in plain English — 'remote senior react roles on AI teams' — and get ranked results." },
              { icon: Sparkles, title: "AI matching", desc: "Jobs ranked to your resume by skill overlap and seniority alignment." },
              { icon: FileText, title: "Instant parsing", desc: "Upload a PDF or DOCX — we extract skills, experience, and education in seconds." },
            ].map((f, i) => (
              <div key={i} className="glass-card">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-iron border border-bone/10">
                  <f.icon className="h-5 w-5 text-bone" />
                </div>
                <h3 className="font-geist text-[24px] font-medium text-paper mb-2">{f.title}</h3>
                <p className="text-[16px] text-mist leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </StaggerChildren>
        </section>

        {/* Use Cases Section */}
        <section id="use-cases" className="relative border-t border-bone/[0.06] py-24 sm:py-32 bg-char/30 overflow-hidden">
          <div className="container-page">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              <ScrollReveal direction="left">
                <h2 className="font-geist text-[32px] font-semibold text-paper mb-6">
                  From search to offer.
                </h2>
                <p className="text-[18px] text-mist mb-8">
                  Type what you want in plain English. We turn your query into a ranked feed of roles, pre-scored against your resume — then route you to one-click apply.
                </p>
                <div className="space-y-4">
                  {[
                    "Natural-language search across every live role",
                    "Match score visible before you click apply",
                    "Resume parsed once, reused everywhere"
                  ].map((bullet, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border border-bone/20 bg-void">
                        <span className="text-[12px] text-bone font-medium">{i + 1}</span>
                      </div>
                      <span className="text-[16px] text-bone">{bullet}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-10">
                  <Link href="#jobs">
                    <Button className="rounded-pill bg-paper text-void px-6 hover:bg-paper/90">
                      Try the search
                    </Button>
                  </Link>
                </div>
              </ScrollReveal>
              <Parallax speed={0.8}>
                <div className="glass-card relative aspect-square overflow-hidden bg-void/50 flex items-center justify-center p-8">
                  <div className="absolute inset-0 bg-radial-indigo opacity-20" />
                  <div className="relative z-10 w-full rounded-2xl border border-bone/10 bg-char p-6 shadow-2xl">
                     <div className="flex items-center gap-4 border-b border-bone/10 pb-4">
                       <div className="h-10 w-10 rounded-lg bg-void border border-bone/10 flex items-center justify-center">
                         <Bot className="h-5 w-5 text-bone" />
                       </div>
                       <div>
                         <h4 className="font-geist font-medium text-paper text-[16px]">AI Assistant</h4>
                         <p className="text-[14px] text-mist">Reviewing your matches...</p>
                       </div>
                     </div>
                     <div className="mt-4 space-y-3">
                       <div className="h-8 rounded-pill bg-iron/50 w-3/4" />
                       <div className="h-8 rounded-pill bg-iron/50 w-1/2" />
                     </div>
                  </div>
                </div>
              </Parallax>
            </div>
          </div>
        </section>

        {/* Jobs Section */}
        <JobsSection />

        {/* Companies Section */}
        <CompaniesSection />

        {/* AI Workspace Section */}
        <AiWorkspaceSection />

        {/* Pricing / CTA Section */}
        <section id="pricing" className="container-page py-24 sm:py-32 border-t border-bone/[0.06]">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <h2 className="font-sans text-[48px] tracking-[-0.035em] text-paper mb-6">
              Ready to find your match?
            </h2>
            <p className="text-[18px] text-mist mb-10">
              Join thousands of engineers who have already discovered their next career defining role.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/auth">
                <Button className="h-12 rounded-pill bg-paper text-void px-8 text-[16px] hover:bg-paper/90">
                  Get Started
                </Button>
              </Link>
              <Link href="/post">
                <Button variant="outline" className="h-12 rounded-pill px-8 text-[16px]">
                  Post a Job
                </Button>
              </Link>
            </div>
          </FadeIn>
        </section>
      </main>
      
      {/* Simple Footer */}
      <ScrollReveal>
        <footer className="border-t border-bone/[0.06] py-12 text-center">
          <p className="text-[14px] text-fog">© {new Date().getFullYear()} Dimension. All rights reserved.</p>
        </footer>
      </ScrollReveal>
    </div>
  );
}
```

### 5.5 `src/components/site/header.tsx`
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLenis } from "@/hooks/use-lenis";

export function SiteHeader() {
  const pathname = usePathname();
  const lenis = useLenis();

  // Unified smooth scroll click handler
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (pathname === "/") {
      e.preventDefault();
      const element = document.getElementById(targetId);
      if (element) {
        if (lenis) {
          lenis.scrollTo(element, { offset: -100 });
        } else {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        // Gracefully update address bar history with target hash
        window.history.pushState(null, "", `#${targetId}`);
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-bone/10 bg-void/80 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 transition-colors hover:opacity-80">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-bone text-[11px] font-bold text-void">J</span>
          <span className="text-[18px] font-medium text-bone tracking-tight">jOBiON</span>
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link 
            href={pathname === "/" ? "#features" : "/#features"} 
            onClick={(e) => handleScroll(e, "features")}
            className="text-[14px] font-medium text-mist transition-colors hover:text-bone"
          >
            Features
          </Link>
          <Link 
            href={pathname === "/" ? "#jobs" : "/#jobs"} 
            onClick={(e) => handleScroll(e, "jobs")}
            className="text-[14px] font-medium text-mist transition-colors hover:text-bone"
          >
            Jobs
          </Link>
          <Link 
            href={pathname === "/" ? "#companies" : "/#companies"} 
            onClick={(e) => handleScroll(e, "companies")}
            className="text-[14px] font-medium text-mist transition-colors hover:text-bone"
          >
            Companies
          </Link>
          <Link 
            href={pathname === "/" ? "#ai-workspace" : "/#ai-workspace"} 
            onClick={(e) => handleScroll(e, "ai-workspace")}
            className="text-[14px] font-medium text-mist transition-colors hover:text-bone"
          >
            AI Workspace
          </Link>
          <Link 
            href="/dashboard" 
            className="text-[14px] font-medium text-mist transition-colors hover:text-bone"
          >
            Dashboard
          </Link>
        </nav>
        
        <div className="flex items-center gap-4">
          <Link href="/post" className="inline-flex h-9 items-center justify-center rounded-pill bg-paper px-4 text-[14px] font-medium text-void transition-colors hover:bg-paper/90">
            Post a Job
          </Link>
        </div>
      </div>
    </header>
  );
}
```

---

## 6. Recommended Premium UI Features

For a highly polished, interactive experience:
1. **Interactive Active Anchor Tracking**:
   Create a small hook `useActiveSection` using `IntersectionObserver` inside `SiteHeader` to highlight navigation tabs (e.g. glowing bottom border or higher opacity) matching whichever section is currently dominant in the viewport.
2. **Glassmorphism Hover Enhancements**:
   Enhance `glass-card` CSS classes or Framer Motion properties inside `JobCard` and `CompaniesSection` with light reflection pulses on hover.
3. **Typing Animation Indicators**:
   When submitting queries or uploading documents in the AI Workspace section, show an animated loading block mimicking natural human typing or database querying to enhance wait feedback.

---

## 7. Verification Method

Once changes are applied by the implementer agent, they can be independently verified using the following steps:
1. **Local Compilation Check**:
   Navigate to the `frontend/` directory and execute:
   ```bash
   npm run build
   ```
   *Expected outcome*: Compilation completes successfully with exit code `0`. Specifically verify that Next.js did not emit warnings about static deoptimization (which would have occurred if `JobsSection`'s use of `useSearchParams` was not properly wrapped in `<Suspense>`).
2. **Scroll Validation**:
   Open the browser, load the website homepage, and click the "Jobs", "Companies", and "AI Workspace" links in the header.
   *Expected outcome*: The page scrolls smoothly to the respective section using Lenis, and target sections receive a subtle highlight border ring before fading back to normal.
3. **Route Cross-Link Validation**:
   Navigate to a detail page (e.g., `/dashboard` or a specific job `/jobs/123`) and click "Companies" in the navbar.
   *Expected outcome*: Browser redirects to the homepage and automatically scrolls/focuses directly on the `#companies` section.
