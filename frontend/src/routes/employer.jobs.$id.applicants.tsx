import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpDown,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Mail,
  MapPin,
  Search,
  Users,
} from "lucide-react";

import { ShrinkNavbar } from "@/components/fx/ShrinkNavbar";
import { MatchRing } from "@/components/fx/MatchRing";
import { GlassPanel } from "@/components/ui-ext/GlassPanel";
import { GradientText } from "@/components/ui-ext/GradientText";
import { Reveal } from "@/components/ui-ext/motion";
import { QueryBoundary } from "@/components/ui-ext/QueryBoundary";
import { Skeleton } from "@/components/ui-ext/Skeleton";
import { EmptyState } from "@/components/ui-ext/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "@/lib/date";
import {
  listJobApplicants,
  updateApplicantStage,
} from "@/lib/api/employer";
import type { Applicant, ApplicantStage } from "@/lib/api/types";
import { toast } from "sonner";
import { BackButton } from "@/components/layout/BackButton";

export const Route = createFileRoute("/employer/jobs/$id/applicants")({
  head: () => ({
    meta: [
      { title: "Applicants — jOBiON" },
      { name: "description", content: "Review applicants, resumes, and ATS scores." },
    ],
  }),
  component: ApplicantsPage,
});

const STAGES: { key: ApplicantStage | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "reviewed", label: "Reviewed" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "interview", label: "Interview" },
  { key: "hired", label: "Hired" },
  { key: "rejected", label: "Rejected" },
];

const stageStyles: Record<ApplicantStage, string> = {
  new: "border-primary/40 text-primary bg-primary/20",
  reviewed: "border-white/20 text-white/70 bg-white/5",
  shortlisted: "border-primary/40 text-primary bg-primary/20",
  interview: "border-primary/40 text-primary bg-primary/20",
  hired: "border-emerald-400/40 text-emerald-200 bg-emerald-500/10",
  rejected: "border-rose-400/40 text-rose-200 bg-rose-500/10",
};

function ApplicantsPage() {
  const { id } = Route.useParams();
  return (
    <div className="min-h-screen bg-transparent text-white">
      <ShrinkNavbar />
      <main className="mx-auto max-w-7xl px-6 pt-32 pb-24">
        <BackButton fallback="/employer" className="mb-6" />
        <Reveal>
          <Link
            to="/employer"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Employer
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.03em]">
                <GradientText>Applicants</GradientText>
              </h1>
              <p className="text-white/50 mt-2 max-w-xl">
                Review candidates ranked by ATS match. Preview resumes and move them through your pipeline.
              </p>
            </div>
          </div>
        </Reveal>

        <QueryBoundary fallback={<TableSkeleton />}>
          <ApplicantsContent jobId={id} />
        </QueryBoundary>
      </main>
    </div>
  );
}

function ApplicantsContent({ jobId }: { jobId: string }) {
  const { data } = useSuspenseQuery({
    queryKey: ["employer", "applicants", jobId],
    queryFn: () => listJobApplicants(jobId),
  });

  const [stage, setStage] = useState<ApplicantStage | "all">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"score" | "recent">("score");
  const [selected, setSelected] = useState<Applicant | null>(null);

  const stageCounts = useMemo(() => {
    const c = new Map<string, number>();
    for (const a of data.items) c.set(a.stage, (c.get(a.stage) ?? 0) + 1);
    c.set("all", data.items.length);
    return c;
  }, [data.items]);

  const filtered = useMemo(() => {
    let items = data.items;
    if (stage !== "all") items = items.filter((a) => a.stage === stage);
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(
        (a) =>
          a.candidate.full_name.toLowerCase().includes(q) ||
          a.candidate.email.toLowerCase().includes(q) ||
          a.matched_keywords.some((k) => k.toLowerCase().includes(q)),
      );
    }
    items = [...items].sort((a, b) =>
      sort === "score"
        ? b.ats_score - a.ats_score
        : new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime(),
    );
    return items;
  }, [data.items, stage, query, sort]);

  if (!data.items.length) {
    return (
      <GlassPanel className="p-10">
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No applicants yet"
          description="Once candidates apply to this role, they'll show up here ranked by ATS score."
        />
      </GlassPanel>
    );
  }

  return (
    <>
      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, or keyword..."
            className="pl-9 bg-white/5 border-white/10 h-10"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="w-[180px] h-10 bg-white/5 border-white/10">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1 text-white/50" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Sort: ATS score</SelectItem>
            <SelectItem value="recent">Sort: Most recent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Filter className="h-4 w-4 text-white/40 self-center mr-1" />
        {STAGES.map((s) => {
          const active = stage === s.key;
          const count = stageCounts.get(s.key) ?? 0;
          return (
            <button
              key={s.key}
              onClick={() => setStage(s.key)}
              className={`px-3 py-1.5 rounded-full border text-xs uppercase tracking-wider font-mono transition ${
                active
                  ? "border-white/40 bg-white/10 text-white"
                  : "border-white/10 bg-white/[0.02] text-white/50 hover:text-white/80"
              }`}
            >
              {s.label}
              <span className="ml-2 text-white/40 tabular-nums">{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <GlassPanel className="p-10">
          <EmptyState
            icon={<Filter className="h-6 w-6" />}
            title="No applicants match"
            description="Try clearing the search or picking a different stage."
          />
        </GlassPanel>
      ) : (
        <ApplicantsTable
          applicants={filtered}
          onSelect={setSelected}
          jobId={jobId}
        />
      )}

      <ApplicantSheet
        applicant={selected}
        jobId={jobId}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  );
}

function ApplicantsTable({
  applicants,
  onSelect,
  jobId,
}: {
  applicants: Applicant[];
  onSelect: (a: Applicant) => void;
  jobId: string;
}) {
  return (
    <GlassPanel className="overflow-hidden">
      <div className="hidden md:grid grid-cols-[minmax(0,2.4fr)_110px_minmax(0,1.6fr)_120px_140px] gap-4 px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-white/40 border-b border-white/5 font-mono">
        <div>Candidate</div>
        <div className="text-right">ATS</div>
        <div>Top matches</div>
        <div>Stage</div>
        <div className="text-right">Applied</div>
      </div>
      <ul className="divide-y divide-white/5">
        {applicants.map((a, i) => (
          <ApplicantRow
            key={a.id}
            applicant={a}
            index={i}
            onSelect={onSelect}
            jobId={jobId}
          />
        ))}
      </ul>
    </GlassPanel>
  );
}

function ApplicantRow({
  applicant,
  index,
  onSelect,
  jobId,
}: {
  applicant: Applicant;
  index: number;
  onSelect: (a: Applicant) => void;
  jobId: string;
}) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (stage: ApplicantStage) => updateApplicantStage(applicant.id, stage),
    onSuccess: (_data, stage) => {
      qc.setQueryData(
        ["employer", "applicants", jobId],
        (prev: { items: Applicant[]; total: number; page: number; page_size: number } | undefined) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((it) =>
                  it.id === applicant.id ? { ...it, stage } : it,
                ),
              }
            : prev,
      );
      toast.success(`Moved to ${stage}`);
    },
    onError: () => toast.error("Could not update stage"),
  });

  const initials = applicant.candidate.full_name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  const scoreColor =
    applicant.ats_score >= 85
      ? "text-emerald-300"
      : applicant.ats_score >= 70
        ? "text-primary"
        : "text-white/60";

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="grid md:grid-cols-[minmax(0,2.4fr)_110px_minmax(0,1.6fr)_120px_140px] gap-4 items-center px-6 py-4 hover:bg-white/[0.03] transition group cursor-pointer"
      onClick={() => onSelect(applicant)}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-primary via-primary/70 to-primary border border-white/10 grid place-items-center text-xs font-mono uppercase text-white/90">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="truncate text-white font-medium">
            {applicant.candidate.full_name}
          </div>
          <div className="text-xs text-white/40 truncate flex items-center gap-2 mt-0.5">
            <Mail className="h-3 w-3" />
            <span className="truncate">{applicant.candidate.email}</span>
            {applicant.candidate.location && (
              <>
                <span className="text-white/20">·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {applicant.candidate.location}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="md:text-right font-mono tabular-nums">
        <span className={`text-lg font-semibold ${scoreColor}`}>
          {applicant.ats_score}
        </span>
        <span className="text-xs text-white/30 ml-1">/100</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {applicant.matched_keywords.slice(0, 3).map((k) => (
          <span
            key={k}
            className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-200 border border-emerald-400/20"
          >
            {k}
          </span>
        ))}
        {applicant.matched_keywords.length > 3 && (
          <span className="text-[10px] text-white/40 self-center">
            +{applicant.matched_keywords.length - 3}
          </span>
        )}
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <Select
          value={applicant.stage}
          onValueChange={(v) => mutation.mutate(v as ApplicantStage)}
        >
          <SelectTrigger
            className={`h-8 border ${stageStyles[applicant.stage]} font-mono text-[11px] uppercase tracking-wider`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAGES.filter((s) => s.key !== "all").map((s) => (
              <SelectItem key={s.key} value={s.key}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="md:text-right text-xs text-white/40">
        {formatDistanceToNow(applicant.applied_at)}
      </div>
    </motion.li>
  );
}

function ApplicantSheet({
  applicant,
  jobId,
  onOpenChange,
}: {
  applicant: Applicant | null;
  jobId: string;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={!!applicant} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl bg-[#0A0A0A]/95 border-l border-white/10 text-white overflow-y-auto"
      >
        <AnimatePresence mode="wait">
          {applicant && (
            <motion.div
              key={applicant.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <SheetHeader className="text-left">
                <SheetTitle className="text-2xl tracking-[-0.02em] text-white">
                  {applicant.candidate.full_name}
                </SheetTitle>
                <SheetDescription className="text-white/50">
                  {applicant.candidate.headline ?? applicant.candidate.email}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 grid grid-cols-[auto_1fr] gap-6 items-center">
                <MatchRing value={applicant.ats_score} size={120} stroke={9} label="ATS" />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-white/70">
                    <Mail className="h-3.5 w-3.5 text-white/40" />
                    <a
                      href={`mailto:${applicant.candidate.email}`}
                      className="hover:text-white transition"
                    >
                      {applicant.candidate.email}
                    </a>
                  </div>
                  {applicant.candidate.location && (
                    <div className="flex items-center gap-2 text-white/70">
                      <MapPin className="h-3.5 w-3.5 text-white/40" />
                      {applicant.candidate.location}
                    </div>
                  )}
                  <Badge
                    variant="outline"
                    className={`${stageStyles[applicant.stage]} capitalize mt-1`}
                  >
                    {applicant.stage}
                  </Badge>
                </div>
              </div>

              {/* Keywords */}
              <div className="mt-8 grid md:grid-cols-2 gap-4">
                <GlassPanel className="p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-300/80 font-mono mb-3">
                    Matched
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {applicant.matched_keywords.map((k) => (
                      <span
                        key={k}
                        className="text-xs font-mono px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-200 border border-emerald-400/20"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </GlassPanel>
                <GlassPanel className="p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-rose-300/80 font-mono mb-3">
                    Missing
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {applicant.missing_keywords.length ? (
                      applicant.missing_keywords.map((k) => (
                        <span
                          key={k}
                          className="text-xs font-mono px-2 py-1 rounded-full bg-rose-500/10 text-rose-200 border border-rose-400/20"
                        >
                          {k}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-white/40">No gaps detected</span>
                    )}
                  </div>
                </GlassPanel>
              </div>

              {/* Resume preview */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/50 font-mono">
                    Resume
                  </div>
                  <a
                    href={applicant.resume.preview_url ?? "#"}
                    onClick={(e) => {
                      if (!applicant.resume.preview_url) e.preventDefault();
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                </div>
                <GlassPanel className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-11 rounded-md bg-gradient-to-br from-primary via-primary/70 to-primary border border-white/10 grid place-items-center">
                      <FileText className="h-5 w-5 text-white/70" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-white">
                        {applicant.resume.filename}
                      </div>
                      <div className="text-xs text-white/40 mt-0.5">
                        PDF preview
                      </div>
                    </div>
                    <a
                      href={applicant.resume.preview_url ?? "#"}
                      onClick={(e) => {
                        if (!applicant.resume.preview_url) e.preventDefault();
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition"
                    >
                      Open <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  {applicant.resume.preview_url ? (
                    <iframe
                      title={`${applicant.candidate.full_name} resume`}
                      src={applicant.resume.preview_url}
                      className="mt-4 w-full h-[520px] rounded-lg border border-white/10 bg-white/[0.02]"
                    />
                  ) : (
                    <div className="mt-4 h-[240px] rounded-lg border border-dashed border-white/10 bg-white/[0.02] grid place-items-center text-center px-6">
                      <div>
                        <div className="text-sm text-white/70">
                          Preview unavailable in demo
                        </div>
                        <div className="text-xs text-white/40 mt-1">
                          Wire a signed URL from the resumes bucket to render inline.
                        </div>
                      </div>
                    </div>
                  )}
                </GlassPanel>
              </div>

              {/* Cover letter */}
              {applicant.cover_letter && (
                <div className="mt-8">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/50 font-mono mb-3">
                    Cover letter
                  </div>
                  <GlassPanel className="p-5 text-sm text-white/70 whitespace-pre-wrap leading-relaxed">
                    {applicant.cover_letter}
                  </GlassPanel>
                </div>
              )}

              <div className="mt-8 flex items-center justify-between text-xs text-white/40">
                <span>Applied {formatDistanceToNow(applicant.applied_at)}</span>
                <Link
                  to="/jobs/$id"
                  params={{ id: jobId }}
                  className="hover:text-white transition inline-flex items-center gap-1"
                >
                  View job posting <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-[180px]" />
      </div>
      <Skeleton className="h-8 w-2/3" />
      <GlassPanel className="p-6 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[auto_1fr_auto] gap-4 items-center">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </GlassPanel>
    </div>
  );
}
