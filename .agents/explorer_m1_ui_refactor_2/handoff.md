# Handoff Report: Single Hero Website UI Refactor Exploration

This report analyzes the frontend components of the jOBiON application to prepare for refactoring the navigation and page structure into a single-page scrolling "Single Hero Website".

---

## 1. Observation

Based on a detailed inspection of the frontend repository, the following file paths, line ranges, and structures were observed:

### A. Routing & Search Parameters in `BrowseJobs`
- **File**: `C:\Users\Lenovo\Desktop\RAG & LLM\frontend\src\app\jobs\page.tsx`
- **Line 6**: `import { useSearchParams } from "next/navigation";`
- **Lines 27-28**:
  ```typescript
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || searchParams.get("search") || "";
  ```
- **Lines 175-181**:
  ```typescript
  export default function BrowseJobs() {
    return (
      <Suspense fallback={<div className="container-page py-10 animate-pulse h-[600px] bg-void rounded-xl" />}>
        <BrowseJobsContent />
      </Suspense>
    );
  }
  ```
- **Line 65**: `<SiteHeader />` is embedded directly within the page container.
- **Lines 67-70**: Page-wide background effects are present:
  ```typescript
  <div aria-hidden className="absolute inset-0 -z-20 bg-dawn-wash opacity-50" />
  <Parallax speed={0.6} className="absolute inset-0 -z-10 pointer-events-none">
    <div aria-hidden className="absolute left-1/2 top-[10%] h-[600px] w-[600px] -translate-x-1/2 bg-radial-indigo" />
  </Parallax>
  ```

### B. Simple Fetching in `CompaniesIndex`
- **File**: `C:\Users\Lenovo\Desktop\RAG & LLM\frontend\src\app\companies\page.tsx`
- **Lines 8-12**:
  ```typescript
  export default function CompaniesIndex() {
    const { data: companies = [], isLoading } = useQuery({ 
      queryKey: ["companies"], 
      queryFn: () => api.companies.list() 
    });
  ```
- **Line 27**: Uses standalone Link referencing sub-routes:
  ```typescript
  <Link href={`/companies/${c.slug || c.id}`} ...>
  ```
- No headers or router search parameters are used in this file.

### C. Workspace Actions and Routing in `AiWorkspacePage`
- **File**: `C:\Users\Lenovo\Desktop\RAG & LLM\frontend\src\app\ai-workspace\page.tsx`
- **Lines 15-18**:
  ```typescript
  export default function AiWorkspacePage() {
    useHighlightSection();
    const router = useRouter();
  ```
- **Line 70**: Scrolls into view dynamically:
  ```typescript
  document.getElementById("ai-matching")?.scrollIntoView({ behavior: "smooth" });
  ```
- **Line 238**: Programmatic routing is used inside matching jobs:
  ```typescript
  <Button className="w-full gap-2" variant="default" onClick={() => router.push(`/jobs/${job.id}`)}>
  ```

### D. Highlight Hook
- **File**: `C:\Users\Lenovo\Desktop\RAG & LLM\frontend\src\hooks\use-highlight.ts`
- **Lines 5-7**:
  ```typescript
  export function useHighlightSection() {
    const pathname = usePathname();
    const lenis = useLenis();
  ```
- **Lines 9-34**: The effect is solely dependent on `pathname`:
  ```typescript
  useEffect(() => {
    ...
  }, [pathname]);
  ```

### E. Navigation Header
- **File**: `C:\Users\Lenovo\Desktop\RAG & LLM\frontend\src\components\site\header.tsx`
- **Lines 16-27**: Conditional routing is implemented based on the pathname:
  ```typescript
  {pathname === "/" ? (
    <>
      <Link href="#features" className="text-[14px] font-medium text-mist transition-colors hover:text-bone">Features</Link>
      <Link href="#use-cases" className="text-[14px] font-medium text-mist transition-colors hover:text-bone">Use Cases</Link>
      <Link href="#pricing" className="text-[14px] font-medium text-mist transition-colors hover:text-bone">Pricing</Link>
    </>
  ) : (
    <>
      <Link href="/jobs" className="text-[14px] font-medium text-mist transition-colors hover:text-bone">Jobs</Link>
      <Link href="/companies" className="text-[14px] font-medium text-mist transition-colors hover:text-bone">Companies</Link>
    </>
  )}
  ```

---

## 2. Logic Chain

1. **Static Deoptimization Prevention**:
   - `BrowseJobsContent` relies on `useSearchParams()`.
   - Next.js build configuration statically optimizes the homepage (`src/app/page.tsx`) by default.
   - If a client component using `useSearchParams` is directly rendered inside the homepage layout without a `<Suspense>` boundary, Next.js will bail out of static optimization for the entire homepage, causing it to be rendered dynamically at runtime.
   - **Conclusion**: Wrapping `BrowseJobsContent` inside a `<Suspense>` block within the newly created `src/components/sections/jobs-section.tsx` is required to isolate and protect the homepage's static compilation.

2. **Decoupling Layout Elements**:
   - Section components like `JobsSection` must be pure segments of a page.
   - Rendering `<SiteHeader />` inside multiple section components would result in duplicate headers once they are integrated onto the homepage.
   - **Conclusion**: Remove the `<SiteHeader />` imports and render statements from the body of `jobs/page.tsx` during extraction.

3. **Background Bleed Isolation**:
   - Radial gradients and parallax backdrops are styled with absolute layouts `-z-10` or `-z-20`.
   - Placing these backdrops sequentially on a single page can cause them to overlap or block interaction on adjacent sections unless they are styled relative to their section boundaries.
   - **Conclusion**: The sections must be styled as `relative overflow-hidden` wrapper containers, and background overlays must be adjusted with lower opacities (`opacity-30` or `opacity-80`) and correct boundaries.

4. **Navigating across Pages vs. Sections**:
   - A link like `<Link href="#jobs">` works when the user is on the homepage. However, if the user is on a standalone sub-route (e.g., `/dashboard` or `/jobs/[id]`), clicking that link will fail to scroll since `#jobs` does not exist on those routes.
   - Conversely, `<Link href="/#jobs">` works from both other routes and the homepage. However, on the homepage, clicking a link with the path prefix `/` can trigger a page reload/router transition instead of a simple local scroll.
   - **Conclusion**: The header navigation links should conditionally resolve:
     - On `/`: Use relative hash anchors (e.g., `#jobs`) to trigger instant smooth scrolling via Lenis.
     - On other routes: Use path-prefixed hash anchors (e.g., `/#jobs`) to navigate back to the homepage and scroll to the correct section on load.

5. **Same-page Anchor Highlights**:
   - The current `useHighlightSection` hook is triggered exclusively on `pathname` changes (`[pathname]`).
   - If a user on `/` clicks `#companies` and then clicks `#ai-workspace`, the pathname remains `/`. The hook will not trigger, and the target section will not receive its highlight border styling.
   - **Conclusion**: Update `useHighlightSection` to listen to `"hashchange"` window events, allowing same-page clicks to highlight sections.

---

## 3. Caveats

- **No Code Modifications**: Under our read-only constraints, no changes have been applied to the code.
- **Standalone Sub-Routes**: The individual item routes `/jobs/[id]` and `/companies/[id]` remain outside the scope of deletion and must continue working. They will resolve correctly when clicking job/company cards from the sections.
- **Vite/TanStack Router Files**: A directory `src/routes/` exists containing routing files. Based on `package.json` configurations showing scripts `next dev` and `next build` and the presence of `next.config.ts`, this codebase uses the Next.js App Router (`src/app/`). The `src/routes/` files appear to be legacy remnants or for secondary configuration and do not require modification.

---

## 4. Conclusion

The codebase is fully ready for refactoring. The extraction can proceed in distinct stages according to `PROJECT.md`. Below are the recommended, precise file contents designed to be directly implemented.

### Proposed File Content Outlines

#### 1. `src/components/sections/jobs-section.tsx`
```typescript
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
import { cn } from "@/lib/utils";

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
    <div className="w-full">
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

export default function JobsSection({ className, id = "jobs" }: { className?: string; id?: string }) {
  return (
    <section id={id} className={cn("relative py-24 border-b border-bone/10 overflow-hidden text-bone font-sans", className)}>
      <div aria-hidden className="absolute inset-0 -z-20 bg-dawn-wash opacity-30" />
      <Parallax speed={0.6} className="absolute inset-0 -z-10 pointer-events-none">
        <div aria-hidden className="absolute left-1/2 top-[10%] h-[600px] w-[600px] -translate-x-1/2 bg-radial-indigo opacity-80" />
      </Parallax>
      <div className="container-page relative z-10">
        <Suspense fallback={<div className="container-page py-10 animate-pulse h-[600px] bg-void rounded-xl border border-bone/10" />}>
          <JobsSectionContent />
        </Suspense>
      </div>
    </section>
  );
}
```

#### 2. `src/components/sections/companies-section.tsx`
```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";

export default function CompaniesSection({ className, id = "companies" }: { className?: string; id?: string }) {
  const { data: companies = [], isLoading } = useQuery({ 
    queryKey: ["companies"], 
    queryFn: () => api.companies.list() 
  });
  
  return (
    <section id={id} className={cn("relative py-24 border-b border-bone/10 text-bone bg-char/10 font-sans", className)}>
      <div className="container-page">
        <h2 className="font-display text-4xl font-bold tracking-tight text-paper">Companies hiring</h2>
        <p className="mt-2 text-md text-mist">{companies.length} teams shipping with jOBiON.</p>

        {isLoading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card h-32 animate-pulse bg-char" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((c, i) => (
              <motion.div 
                key={c.id} 
                initial={{ opacity: 0, y: 8 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/companies/${c.slug || c.id}`} className="glass-card block p-5 transition-colors hover:border-primary/40">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-lg border border-bone/10 bg-void font-semibold text-paper">
                      {c.name[0]}
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-paper">{c.name}</h3>
                      <p className="text-xs text-mist">{c.location ?? "Remote"}</p>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-mist">{c.about}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
```

#### 3. `src/components/sections/ai-workspace-section.tsx`
```typescript
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
import type { JobWithCompany } from "@/types";
import { cn } from "@/lib/utils";

export default function AiWorkspaceSection({ className, id = "ai-workspace" }: { className?: string; id?: string }) {
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
        document.getElementById("ai-matching")?.scrollIntoView({ behavior: "smooth" });
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
    <section id={id} className={cn("relative py-24 border-b border-bone/10 text-bone font-sans", className)}>
      <div className="container-page">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-display font-bold tracking-tight sm:text-5xl text-paper">
            AI <span className="text-gradient-accent">Workspace</span>
          </h2>
          <p className="mt-4 text-lg text-mist max-w-2xl mx-auto">
            Experience the power of semantic search, instant resume parsing, and personalized AI matching all in one place.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Semantic Search Section */}
          <motion.div 
            id="semantic-search"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border border-bone/10 bg-char/25 p-6 shadow-sm flex flex-col backdrop-blur-md"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bone/5 text-paper border border-bone/10">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-paper">Semantic Search</h3>
                <p className="text-sm text-mist">Find roles using natural language.</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Input 
                placeholder="e.g. 'remote senior react roles on AI teams'" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 bg-void/50 border-bone/10 text-bone placeholder:text-fog focus-visible:ring-1 focus-visible:ring-bone/30"
              />
              <Button onClick={handleSearch} disabled={isSearching} className="bg-paper text-void hover:bg-paper/90">
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
            
            <div className="mt-4 flex-1 rounded-md border border-dashed border-bone/10 bg-void/35 p-4 overflow-y-auto max-h-[300px]">
              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map(j => (
                    <JobCard key={j.id} job={j} />
                  ))}
                </div>
              ) : isSearching ? (
                <div className="h-full min-h-[150px] flex items-center justify-center text-sm text-mist animate-pulse">
                  Searching vector database for: "{searchQuery}"...
                </div>
              ) : (
                <div className="h-full min-h-[150px] flex items-center justify-center text-sm text-mist text-center">
                  Try searching for a job role in plain English.
                </div>
              )}
            </div>
          </motion.div>

          {/* Resume Parsing Section */}
          <motion.div 
            id="resume-parsing"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-bone/10 bg-char/25 p-6 shadow-sm flex flex-col backdrop-blur-md"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bone/5 text-paper border border-bone/10">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-paper">Instant Resume Parsing</h3>
                <p className="text-sm text-mist">Extract skills and experience instantly.</p>
              </div>
            </div>
            
            <input 
              type="file" 
              accept=".pdf"
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            
            <div className="flex flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed border-bone/10 bg-void/35 p-10 text-center transition-colors hover:bg-void/50">
              <UploadCloud className="h-10 w-10 text-mist" />
              <div>
                <p className="text-sm font-medium text-paper">Click to upload or drag and drop</p>
                <p className="text-xs text-mist">PDF (max. 5MB)</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="border-bone/20 text-bone hover:bg-iron">
                {isUploading ? "Uploading..." : "Select Resume"}
              </Button>
            </div>

            {parsedSkills.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2 text-paper">Extracted Skills:</h4>
                <div className="flex flex-wrap gap-1.5">
                  {parsedSkills.map((s, i) => (
                    <span key={i} className="bg-paper/10 text-paper text-xs px-2 py-1 rounded-md border border-bone/5">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* AI Matching Section */}
          <motion.div 
            id="ai-matching"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-bone/10 bg-char/25 p-6 shadow-sm lg:col-span-2 backdrop-blur-md"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bone/5 text-paper border border-bone/10">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-paper">AI Matching & One-Click Apply</h3>
                <p className="text-sm text-mist">See how your parsed profile matches with live jobs.</p>
              </div>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {matchedJobs.length > 0 ? (
                matchedJobs.map((job) => (
                  <div key={job.id} className="flex flex-col rounded-lg border border-paper/40 bg-char/30 p-5 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="h-10 w-10 rounded bg-paper/10 border border-bone/10 flex items-center justify-center font-bold text-paper">
                        {job.company?.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400 border border-green-500/20">
                        {Math.floor(Math.random() * (99 - 85 + 1) + 85)}% Match
                      </span>
                    </div>
                    <h4 className="font-semibold text-lg line-clamp-1 text-paper">{job.title}</h4>
                    <p className="text-sm text-mist line-clamp-1 mb-4">{job.company?.name}</p>
                    
                    <div className="mt-auto">
                      <Button className="w-full gap-2 bg-paper text-void hover:bg-paper/90" variant="default" onClick={() => router.push(`/jobs/${job.id}`)}>
                        <Zap className="h-4 w-4 fill-current" />
                        One-click Apply
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                [1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col rounded-lg border border-bone/10 bg-void/35 p-5 opacity-40 grayscale">
                    <div className="flex items-start justify-between mb-2">
                      <div className="h-10 w-10 rounded bg-iron/50" />
                      <span className="inline-flex items-center rounded-full bg-iron px-2 py-0.5 text-xs font-medium text-mist">
                        --% Match
                      </span>
                    </div>
                    <div className="mt-2 h-4 w-3/4 rounded bg-iron/50" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-iron/50" />
                    
                    <div className="mt-6">
                      <Button className="w-full gap-2 border-bone/10 text-mist" variant="outline" disabled>
                        Upload Resume First
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* AI Assistant Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-bone/10 bg-char/25 shadow-sm lg:col-span-2 overflow-hidden flex flex-col min-h-[400px] backdrop-blur-md"
          >
            <div className="flex items-center gap-3 p-6 border-b border-bone/10 bg-char/10">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bone/5 text-paper border border-bone/10">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-paper">AI Assistant</h3>
                <p className="text-sm text-mist">Chat with the open-roles index.</p>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[300px] bg-void/10">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm border ${
                    msg.role === "user" 
                      ? "bg-paper text-void border-paper" 
                      : "bg-char border-bone/10 text-paper"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleChat} className="p-4 border-t border-bone/10 bg-void/50 flex gap-2">
              <Input 
                placeholder="e.g. Can you find me jobs that require Python and allow remote work?"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-void/50 border-bone/10 text-bone placeholder:text-fog focus-visible:ring-1 focus-visible:ring-bone/30"
              />
              <Button type="submit" size="icon" className="bg-paper text-void hover:bg-paper/90">
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

#### 4. `src/app/page.tsx`
```typescript
"use client";

import { SiteHeader } from "@/components/site/header";
import { Hero } from "@/components/landing/hero";
import { Search, Sparkles, FileText, Bot } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/animation/fade-in";
import { StaggerChildren } from "@/components/animation/stagger";
import { ScrollReveal } from "@/components/animation/scroll-reveal";
import { Parallax } from "@/components/animation/parallax";

// Extracted Section Components
import JobsSection from "@/components/sections/jobs-section";
import CompaniesSection from "@/components/sections/companies-section";
import AiWorkspaceSection from "@/components/sections/ai-workspace-section";
import { useHighlightSection } from "@/hooks/use-highlight";

export default function LandingPage() {
  // Trigger highlighting & scroll logic on page mount/routing
  useHighlightSection();

  return (
    <div className="min-h-dvh bg-void text-bone font-sans selection:bg-paper selection:text-void">
      <SiteHeader />
      <main className="relative z-10 bg-void">
        <Hero />
        
        {/* Features Section */}
        <section id="features" className="container-page py-24 sm:py-32 border-b border-bone/[0.06]">
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
        <section id="use-cases" className="relative border-b border-bone/[0.06] py-24 sm:py-32 bg-char/30 overflow-hidden">
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

        {/* Vertically Integrated Sections */}
        <JobsSection />
        <CompaniesSection />
        <AiWorkspaceSection />

        {/* Pricing / CTA Section */}
        <section id="pricing" className="container-page py-24 sm:py-32">
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

#### 5. `src/components/site/header.tsx`
```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-bone/10 bg-void/80 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 transition-colors hover:opacity-80">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-bone text-[11px] font-bold text-void">J</span>
          <span className="text-[18px] font-medium text-bone tracking-tight">jOBiON</span>
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link 
            href={isHome ? "#features" : "/#features"} 
            className="text-[14px] font-medium text-mist transition-colors hover:text-bone"
          >
            Features
          </Link>
          <Link 
            href={isHome ? "#jobs" : "/#jobs"} 
            className="text-[14px] font-medium text-mist transition-colors hover:text-bone"
          >
            Jobs
          </Link>
          <Link 
            href={isHome ? "#companies" : "/#companies"} 
            className="text-[14px] font-medium text-mist transition-colors hover:text-bone"
          >
            Companies
          </Link>
          <Link 
            href={isHome ? "#ai-workspace" : "/#ai-workspace"} 
            className="text-[14px] font-medium text-mist transition-colors hover:text-bone"
          >
            AI Workspace
          </Link>
          <Link 
            href={isHome ? "#pricing" : "/#pricing"} 
            className="text-[14px] font-medium text-mist transition-colors hover:text-bone"
          >
            Pricing
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

## 5. Verification Method

To independently verify the implementation, the following checks and commands must be executed:

1. **Next.js Compilation Check**:
   - Run the build command inside the `frontend/` directory:
     ```bash
     npm run build
     ```
   - *Pass condition*: Build completes with exit code 0.
   - *Invalidation condition*: Next.js build errors out with static generation bailouts / static deoptimization warnings (which would indicate that `useSearchParams()` in the `JobsSection` is not wrapped in `<Suspense>`).

2. **Codebase Structural Validation**:
   - Verify the standalone files `src/app/jobs/page.tsx`, `src/app/companies/page.tsx`, and `src/app/ai-workspace/page.tsx` are fully deleted (M2 milestone).
   - Verify that the newly created components are located in `src/components/sections/`.

3. **Same-page Navigation Scroll & Highlight Event Listening**:
   - To make sure same-page clicks trigger the `useHighlightSection` hook, the hook should be updated in `src/hooks/use-highlight.ts` to register a `"hashchange"` event listener:
     ```typescript
     import { useEffect } from "react";
     import { usePathname } from "next/navigation";
     import { useLenis } from "./use-lenis";

     export function useHighlightSection() {
       const pathname = usePathname();
       const lenis = useLenis();

       useEffect(() => {
         const handleHighlight = () => {
           const hash = window.location.hash;
           if (hash) {
             const element = document.querySelector(hash);
             if (element) {
               if (lenis) {
                 lenis.scrollTo(element as HTMLElement, { offset: -100 });
               } else {
                 element.scrollIntoView({ behavior: "smooth", block: "center" });
               }
               
               element.classList.add(
                 "ring-2", 
                 "ring-primary", 
                 "ring-offset-4", 
                 "ring-offset-background", 
                 "shadow-[0_0_30px_rgba(var(--primary),0.3)]", 
                 "transition-all", 
                 "duration-1000"
               );
               
               setTimeout(() => {
                 element.classList.remove(
                   "ring-2", 
                   "ring-primary", 
                   "ring-offset-4", 
                   "ring-offset-background", 
                   "shadow-[0_0_30px_rgba(var(--primary),0.3)]"
                 );
               }, 3000);
             }
           }
         };

         // Trigger on mount or path change
         const timeout = setTimeout(handleHighlight, 500);

         // Add listener for click navigation on the same page
         window.addEventListener("hashchange", handleHighlight);

         return () => {
           clearTimeout(timeout);
           window.removeEventListener("hashchange", handleHighlight);
         };
       }, [pathname, lenis]);
     }
     ```
   - Test this by clicking "Jobs" and "Companies" links in the header while on `/`. Both smooth scrolling and the 3-second temporary highlight border should execute perfectly.
