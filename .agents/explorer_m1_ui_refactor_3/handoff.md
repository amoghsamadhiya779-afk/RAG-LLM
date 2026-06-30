# Handoff Report: Section Component Extraction & Single Hero Integration

This report provides the read-only investigation findings, logic chain, and implementation blueprints for refactoring the Next.js frontend into a scrollable, unified "Single Hero Website".

---

## 1. Observations

### 1.1 Pages Undergoing Extraction
1. **Browse Jobs Page** (`frontend/src/app/jobs/page.tsx`)
   - Uses `useSearchParams` hook to parse search parameters (lines 27-28):
     ```typescript
     const searchParams = useSearchParams();
     const initialQ = searchParams.get("q") || searchParams.get("search") || "";
     ```
   - Fetches and lists roles with TanStack `useQuery` based on filters and query (lines 45-58).
   - Renders a page-level `<SiteHeader />` on line 65.
   - Contains a page-level layout wrapper with background parallax (lines 64-70):
     ```typescript
     <div className="relative min-h-dvh text-bone pb-12 font-sans overflow-hidden">
       <SiteHeader />
       {/* Dimension Gradient Backdrop */}
       <div aria-hidden className="absolute inset-0 -z-20 bg-dawn-wash opacity-50" />
       <Parallax speed={0.6} className="absolute inset-0 -z-10 pointer-events-none">
         <div aria-hidden className="absolute left-1/2 top-[10%] h-[600px] w-[600px] -translate-x-1/2 bg-radial-indigo" />
       </Parallax>
     ```
2. **Companies Index Page** (`frontend/src/app/companies/page.tsx`)
   - Queries companies list using `useQuery` (lines 9-12).
   - Renders animated list of companies utilizing Framer Motion `motion.div` (lines 25-41).
   - Wraps content in page-level `<div className="container-page py-10">` (line 15).
3. **AI Workspace Page** (`frontend/src/app/ai-workspace/page.tsx`)
   - Invokes `useHighlightSection` hook on mount (line 16).
   - Directs navigation using `next/navigation`'s `useRouter` on "One-click Apply" (line 17, line 238).
   - Leverages element-based scrolling for matched jobs anchor (line 70):
     ```typescript
     document.getElementById("ai-matching")?.scrollIntoView({ behavior: "smooth" });
     ```
   - Consists of semantic search, resume PDF parser (via `UploadCloud` input file handler), recommended/matched jobs grid, and inline AI Assistant chat component.

### 1.2 Layout & Navigation Layout
1. **Global Root Layout** (`frontend/src/app/layout.tsx`)
   - Standardizes global page imports and wraps children with standard fonts, `<Providers>`, and a custom `<SmoothScroll>` (lines 21-29) which mounts GSAP and Lenis.
   - Does *not* render `<SiteHeader />`. Therefore, individual pages/subpages control the presence of the header.
2. **Site Header** (`frontend/src/components/site/header.tsx`)
   - Employs routing conditional paths (lines 16-27) that toggle based on whether the pathname is `/`.
   - Renders standalone Router Links (`/jobs`, `/companies`, `/ai-workspace`).
3. **Smooth Scroll Provider** (`frontend/src/components/animation/smooth-scroll.tsx` & `hooks/use-lenis.ts`)
   - Instantiates a Lenis scroll listener (lines 26-34) and publishes the lenis instance via `LenisContext`.
   - Offers `useLenis()` hook (exported from `src/hooks/use-lenis.ts`) returning the instance.

### 1.3 Available Premium UI Components
- Unused/partially integrated components found in `src/components/landing/`:
  - `<LogoMarquee />`: Smooth CSS-based infinite brand scroller (Stripe, Vercel, OpenAI, GitHub, etc.).
  - `<SplitFeature />`: Staggered split column section displaying value props alongside interactive visual mockups.
  - `<MatchVisual />`: Search query visual demonstration displaying semantic match percentages.
  - `<PipelineVisual />`: Interactive applicant tracking board showing applicant flow stages.
  - `<PricingCards />`: A beautifully formatted grid showing job posting subscription tiers.
  - `<FAQ />`: Collapsible shadcn Accordion detailing common questions.

---

## 2. Logic Chain

1. **Next.js Static Deoptimization Mitigation**:
   - Next.js pre-compiles pages to static HTML during builds. 
   - `BrowseJobsContent` makes direct calls to `useSearchParams()`.
   - If `BrowseJobsContent` is placed directly inside `src/app/page.tsx` without an explicit `<Suspense>` boundary, the Next.js compiler will flag the page as dynamically deoptimized. This forces the entire landing page to be client-side rendered, degrading load speeds and performance.
   - Therefore, wrapping the search content inside `src/components/sections/jobs-section.tsx` in a `<Suspense>` boundary ensures the dynamic search parameter parser is localized and the homepage remains static.

2. **Section Extraction Strategy**:
   - Extracted sections must accept `className?: string` to support flexible custom wrappers.
   - The `<SiteHeader />` rendering must be completely removed from `JobsSection` to avoid rendering duplicate header markups on the integrated homepage.
   - We must convert page-level wrappers (like `min-h-dvh` in `BrowseJobs`) to semantic HTML elements (`<section id="..." className="...">`) to stack naturally in a single scrolling page.

3. **Unified Navigation Overhaul**:
   - Navigating using absolute hashes (e.g. `/#jobs`, `/#companies`, `/#ai-workspace`) ensures that when a user is on sub-routes (such as a job detail page `/jobs/[id]`), clicking the header links successfully navigates back to the homepage and scrolls to the respective section.
   - When the user is *already* on the homepage, standard page reloads can be prevented by capturing anchor click events and using the `lenis.scrollTo` api from `useLenis()`, providing a smooth, high-fidelity scroll transition.

4. **SaaS Landing Page Polish**:
   - The original `src/app/page.tsx` contains static/rudimentary placeholder divs for features and pricing.
   - Swapping these with the pre-coded `<LogoMarquee />`, `<SplitFeature />` (using `<MatchVisual />` and `<PipelineVisual />`), `<PricingCards />`, and `<FAQ />` leverages the existing animations and styling to upgrade the homepage to a premium-tier SaaS layout.

---

## 3. Caveats

- **API Availability**: The semantic search and resume parsing sections interact directly with client APIs (`api.jobs.search`, etc.). Since this is a read-only exploration agent, we assume the backend endpoints are online and compatible with the calls made by these UI components.
- **Scroll Offset**: Offset values in `lenis.scrollTo` (e.g. `-80` or `-100`) must be adjusted during implementation to match the exact sticky height of the `<SiteHeader />`.
- **CSS Transitions**: Elements highlighted by `useHighlightSection()` utilize Tailwind classes (`ring-2`, `ring-primary`, etc.). These must correspond to configured color variables in the stylesheet.

---

## 4. Conclusion

The Single Hero refactoring can be completed cleanly without layout breaking or Next.js static deoptimization by:
1. Extracting the page contents into three modular sections.
2. Encapsulating `<Suspense>` inside `JobsSection` to protect the homepage build.
3. Updating `<SiteHeader />` to intercept navigation and scroll via Lenis context.
4. Replacing current placeholder sections in `src/app/page.tsx` with premium components already available in `src/components/landing/`.

---

## 5. Proposed File Blueprints

### 5.1 `src/components/sections/jobs-section.tsx`
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
          Browse <span className="text-gradient-accent">Jobs</span>
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore opportunities from our curated list of tech roles or search by keywords.
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
    <section id="jobs" className={`relative py-24 border-t border-bone/[0.06] overflow-hidden ${className || ""}`}>
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
```

### 5.2 `src/components/sections/companies-section.tsx`
```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "@/services/api";

export default function CompaniesSection({ className }: { className?: string }) {
  const { data: companies = [], isLoading } = useQuery({ 
    queryKey: ["companies"], 
    queryFn: () => api.companies.list() 
  });
  
  return (
    <section id="companies" className={`relative py-24 border-t border-bone/[0.06] ${className || ""}`}>
      <div className="container-page">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-display font-bold tracking-tight sm:text-5xl">
            Companies <span className="text-gradient-accent">Hiring</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {companies.length > 0 ? `${companies.length} teams shipping with jOBiON.` : "Discover top teams hiring in tech."}
          </p>
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass-card h-32 animate-pulse" />)}
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
          </div>
        )}
      </div>
    </section>
  );
}
```

### 5.3 `src/components/sections/ai-workspace-section.tsx`
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
import { useHighlightSection } from "@/hooks/use-highlight";
import { toast } from "sonner";
import type { JobWithCompany } from "@/types";

export default function AiWorkspaceSection({ className }: { className?: string }) {
  useHighlightSection();
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
    <section id="ai-workspace" className={`relative py-24 border-t border-bone/[0.06] ${className || ""}`}>
      <div className="container-page">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-display font-bold tracking-tight sm:text-5xl">
            AI <span className="text-gradient-accent">Workspace</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
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
            
            <div className="mt-4 flex-1 rounded-md border border-dashed border-border bg-muted/30 p-4 overflow-y-auto max-h-[300px] min-h-[150px]">
              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map(j => (
                    <JobCard key={j.id} job={j} />
                  ))}
                </div>
              ) : isSearching ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground animate-pulse py-8">
                  Searching vector database for: "{searchQuery}"...
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground text-center py-8">
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

          {/* AI Matching Section */}
          <motion.div 
            id="ai-matching"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
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
                matchedJobs.map((job, index) => (
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

          {/* AI Assistant Drawer (Inline for Workspace) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
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

### 5.4 `src/app/page.tsx`
```typescript
"use client";

import { SiteHeader } from "@/components/site/header";
import { Hero } from "@/components/landing/hero";
import { LogoMarquee } from "@/components/landing/logo-marquee";
import { SplitFeature } from "@/components/landing/split-feature";
import { MatchVisual } from "@/components/landing/match-visual";
import { PipelineVisual } from "@/components/landing/pipeline-visual";
import { PricingCards } from "@/components/landing/pricing-cards";
import { FAQ } from "@/components/landing/faq";
import JobsSection from "@/components/sections/jobs-section";
import CompaniesSection from "@/components/sections/companies-section";
import AiWorkspaceSection from "@/components/sections/ai-workspace-section";
import { FadeIn } from "@/components/animation/fade-in";
import { ScrollReveal } from "@/components/animation/scroll-reveal";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-void text-bone font-sans">
      <SiteHeader />
      <main className="relative z-10 bg-void">
        {/* Hero Section */}
        <Hero />
        
        {/* Brand Trust Section */}
        <LogoMarquee />
        
        {/* Split Feature: AI Matching Visual */}
        <SplitFeature
          eyebrow="AI Matching"
          title="Search that actually understands you."
          body="Forget keyword roulette. We index the details of your actual project experience and match them to the real needs of engineering teams."
          bullets={[
            "Natural-language search across every live role",
            "Pre-scored match percentages shown instantly",
            "Deep alignment based on tech stack and seniority level"
          ]}
          ctaLabel="Try the search"
          ctaTo="#jobs"
          visual={<MatchVisual />}
        />

        {/* Jobs Section */}
        <JobsSection />

        {/* Companies Section */}
        <CompaniesSection />

        {/* Split Feature: Application Pipeline Tracking */}
        <SplitFeature
          eyebrow="For Employers"
          title="Manage applicants without the chaos."
          body="Receive pre-sorted, high-signal applications matched directly to your role specs. Sync candidates directly back to your ATS."
          bullets={[
            "ATS integration with Greenhouse, Lever, and Workable",
            "Instantly view resume parse data & match insights",
            "Collaborate with your team on a simple applicant pipeline"
          ]}
          ctaLabel="Post a Job"
          ctaTo="/post"
          visual={<PipelineVisual />}
          reverse
        />

        {/* AI Workspace Section */}
        <AiWorkspaceSection />

        {/* Pricing Cards Section */}
        <PricingCards />

        {/* FAQ Section */}
        <FAQ />
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
```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLenis } from "@/hooks/use-lenis";

export function SiteHeader() {
  const pathname = usePathname();
  const lenis = useLenis();

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    // If we're on the homepage, prevent default router navigation and smooth scroll using Lenis
    if (pathname === "/") {
      e.preventDefault();
      const targetElement = document.querySelector(hash);
      if (targetElement) {
        if (lenis) {
          lenis.scrollTo(targetElement as HTMLElement, { offset: -80 });
        } else {
          targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        // Update URL hash without causing a page jump
        window.history.pushState(null, "", hash);
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
            href="/#features" 
            onClick={(e) => handleAnchorClick(e, "#features")}
            className="text-[14px] font-medium text-mist transition-colors hover:text-bone"
          >
            Features
          </Link>
          <Link 
            href="/#jobs" 
            onClick={(e) => handleAnchorClick(e, "#jobs")}
            className="text-[14px] font-medium text-mist transition-colors hover:text-bone"
          >
            Jobs
          </Link>
          <Link 
            href="/#companies" 
            onClick={(e) => handleAnchorClick(e, "#companies")}
            className="text-[14px] font-medium text-mist transition-colors hover:text-bone"
          >
            Companies
          </Link>
          <Link 
            href="/#ai-workspace" 
            onClick={(e) => handleAnchorClick(e, "#ai-workspace")}
            className="text-[14px] font-medium text-mist transition-colors hover:text-bone"
          >
            AI Workspace
          </Link>
          
          <Link href="/dashboard" className="text-[14px] font-medium text-mist transition-colors hover:text-bone">
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

## 6. Verification Method

To verify these changes independently:
1. **Compilation Check**: Run `npm run build` inside the `frontend/` directory. Ensure there are no static deoptimization build warnings or typescript compile errors (exit code should be `0`).
2. **Path Resolution**: Inspect the file paths. Ensure that `src/components/sections/` directory is created and populated with the three sections. Confirm that `app/jobs/page.tsx`, `app/companies/page.tsx`, and `app/ai-workspace/page.tsx` have been deleted.
3. **Smooth Scroll Verification**: Launch the development server (`npm run dev`), open the landing page `/`, click "Jobs" or "Companies" in the site header, and verify that the page scrolls smoothly using the GSAP/Lenis transition.
4. **Anchor Handoff Verification**: Navigate to a sub-route (e.g. `/dashboard`), click on "Companies" in the site header, and verify that the browser redirects to `/#companies` and scrolls to the companies section correctly.
