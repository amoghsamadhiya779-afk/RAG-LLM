import { GuestBanner } from "@/components/auth/GuestBanner";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { z } from "zod";
import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Handshake,
  MessageSquare,
  Send,
  Sparkles,
  XCircle,
} from "lucide-react";

import { ShrinkNavbar } from "@/components/fx/ShrinkNavbar";
import { GlassPanel } from "@/components/ui-ext/GlassPanel";
import { GradientText } from "@/components/ui-ext/GradientText";
import { Reveal } from "@/components/ui-ext/motion";
import { QueryBoundary } from "@/components/ui-ext/QueryBoundary";
import { Skeleton } from "@/components/ui-ext/Skeleton";
import { EmptyState } from "@/components/ui-ext/EmptyState";
import { ErrorState } from "@/components/ui-ext/ErrorState";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "@/lib/date";
import { listApplications } from "@/lib/api/applications";
import type { Application, ApplicationStatus } from "@/lib/api/types";
import { BackButton } from "@/components/layout/BackButton";

const STATUSES: ApplicationStatus[] = [
  "submitted",
  "in_review",
  "interview",
  "hired",
  "rejected",
];

const statusMeta: Record<
  ApplicationStatus,
  { label: string; icon: typeof Send; dot: string; ring: string; text: string }
> = {
  submitted: {
    label: "Submitted",
    icon: Send,
    dot: "bg-blue-500",
    ring: "ring-blue-500/30",
    text: "text-blue-400",
  },
  in_review: {
    label: "In review",
    icon: Clock,
    dot: "bg-amber-500",
    ring: "ring-amber-500/30",
    text: "text-amber-400",
  },
  interview: {
    label: "Interview",
    icon: MessageSquare,
    dot: "bg-primary/20",
    ring: "ring-ring/60",
    text: "text-primary",
  },
  hired: {
    label: "Hired",
    icon: Handshake,
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/30",
    text: "text-emerald-400",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    dot: "bg-rose-500",
    ring: "ring-rose-500/30",
    text: "text-rose-400",
  },
};

const searchSchema = z.object({
  status: z.enum(["all", ...STATUSES] as [string, ...string[]]).optional().default("all"),
});

export const Route = createFileRoute("/dashboard_/applications")({
  validateSearch: (input) => searchSchema.parse(input ?? {}),
  head: () => ({
    meta: [
      { title: "Applications — jOBiON" },
      {
        name: "description",
        content: "Track your job applications with a live status timeline.",
      },
    ],
  }),
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen grid place-items-center p-6">
      <ErrorState error={error as Error} onRetry={reset} />
    </div>
  ),
  component: ApplicationsPage,
});

function ApplicationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <ShrinkNavbar />
      <main className="mx-auto max-w-5xl px-4 pt-28 pb-24">
        <GuestBanner />
        <BackButton fallback="/dashboard" className="mb-6" />
        <Reveal>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="size-3.5" /> Dashboard
          </Link>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] md:text-5xl">
            <GradientText>Applications</GradientText>
          </h1>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Every role you've applied to, mapped across the pipeline.
          </p>
        </Reveal>

        <div className="mt-10">
          <QueryBoundary fallback={<ListSkeleton />}>
            <ApplicationsContent />
          </QueryBoundary>
        </div>
      </main>
    </div>
  );
}

function ApplicationsContent() {
  const { status } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data } = useSuspenseQuery({
    queryKey: ["applications"],
    queryFn: () => listApplications(),
  });

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: data.items.length };
    for (const s of STATUSES) map[s] = 0;
    for (const a of data.items) map[a.status] = (map[a.status] ?? 0) + 1;
    return map;
  }, [data.items]);

  const filtered = useMemo(
    () => (status === "all" ? data.items : data.items.filter((a) => a.status === status)),
    [data.items, status],
  );

  const setStatus = (s: string) =>
    navigate({ to: "/dashboard/applications", search: { status: s } });

  return (
    <>
      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-2">
        <FilterChip
          active={status === "all"}
          onClick={() => setStatus("all")}
          label="All"
          count={counts.all}
        />
        {STATUSES.map((s) => (
          <FilterChip
            key={s}
            active={status === s}
            onClick={() => setStatus(s)}
            label={statusMeta[s].label}
            count={counts[s] ?? 0}
            dot={statusMeta[s].dot}
          />
        ))}
      </div>

      {data.items.length === 0 ? (
        <GlassPanel className="p-10">
          <EmptyState
            icon={<FileText className="size-6" />}
            title="No applications yet"
            description="Apply to a role and it'll show up on your timeline."
            action={
              <Link
                to="/jobs"
                className="inline-flex items-center gap-1.5 rounded-md bg-[linear-gradient(135deg,#2E6FFF,#4C82FF,#6AA2FF)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
              >
                <Sparkles className="size-3.5" /> Browse jobs
              </Link>
            }
          />
        </GlassPanel>
      ) : filtered.length === 0 ? (
        <GlassPanel className="p-10">
          <EmptyState
            icon={<FileText className="size-6" />}
            title="Nothing here"
            description={`No applications with status "${statusMeta[status as ApplicationStatus]?.label ?? status}".`}
            action={
              <button
                onClick={() => setStatus("all")}
                className="text-sm font-medium underline underline-offset-4"
              >
                Show all
              </button>
            }
          />
        </GlassPanel>
      ) : (
        <Timeline applications={filtered} />
      )}
    </>
  );
}

function FilterChip({
  active,
  label,
  count,
  onClick,
  dot,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
  dot?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
        active
          ? "border-transparent bg-[linear-gradient(135deg,#2E6FFF,#4C82FF,#6AA2FF)] text-white shadow-[0_0_24px_-8px_rgba(139,92,246,0.6)]"
          : "border-border/60 bg-background/40 text-muted-foreground hover:text-foreground hover:border-border",
      ].join(" ")}
    >
      {dot && <span className={`size-1.5 rounded-full ${dot}`} />}
      <span className="tracking-wide">{label}</span>
      <span
        className={[
          "rounded-full px-1.5 py-0.5 font-mono text-[10px] tabular-nums",
          active ? "bg-white/20 text-white" : "bg-border/40 text-muted-foreground",
        ].join(" ")}
      >
        {count}
      </span>
    </button>
  );
}

function Timeline({ applications }: { applications: Application[] }) {
  return (
    <ol className="relative space-y-4 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-border/60 before:via-border/40 before:to-transparent">
      {applications.map((a, i) => (
        <TimelineItem key={a.id} application={a} index={i} />
      ))}
    </ol>
  );
}

function TimelineItem({ application, index }: { application: Application; index: number }) {
  const meta = statusMeta[application.status];
  const Icon = meta.icon;
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.04 }}
      className="relative pl-11"
    >
      <span
        className={`absolute left-0 top-4 grid size-8 place-items-center rounded-full bg-background ring-2 ${meta.ring}`}
      >
        <span className={`grid size-6 place-items-center rounded-full ${meta.dot}/20`}>
          <Icon className={`size-3.5 ${meta.text}`} />
        </span>
      </span>

      <GlassPanel className="p-4 transition-colors hover:border-border">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Link
              to="/jobs/$id"
              params={{ id: application.job.id }}
              className="block truncate text-base font-medium tracking-tight hover:underline underline-offset-4"
            >
              {application.job.title}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Building2 className="size-3" />
                {application.job.company.name}
              </span>
              <span>·</span>
              <span>{application.job.location}</span>
              {application.job.remote && (
                <>
                  <span>·</span>
                  <span className="text-emerald-400">Remote</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <Badge
              variant="outline"
              className={`gap-1.5 border-current/30 bg-transparent font-mono text-[10px] uppercase tracking-widest ${meta.text}`}
            >
              <CheckCircle2 className="size-3" />
              {meta.label}
            </Badge>
            <span className="font-mono text-[10px] text-muted-foreground">
              {formatDistanceToNow(application.created_at)}
            </span>
          </div>
        </div>

        {application.cover_letter && (
          <p className="mt-3 line-clamp-2 border-t border-border/40 pt-3 text-xs text-muted-foreground">
            {application.cover_letter}
          </p>
        )}
      </GlassPanel>
    </motion.li>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  );
}
