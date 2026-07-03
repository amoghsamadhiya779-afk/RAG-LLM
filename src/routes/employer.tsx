import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Briefcase,
  Eye,
  Plus,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

import { ShrinkNavbar } from "@/components/fx/ShrinkNavbar";
import { GlassPanel } from "@/components/ui-ext/GlassPanel";
import { GradientText } from "@/components/ui-ext/GradientText";
import { GradientButton } from "@/components/ui-ext/GradientButton";
import { Reveal } from "@/components/ui-ext/motion";
import { QueryBoundary } from "@/components/ui-ext/QueryBoundary";
import { Skeleton } from "@/components/ui-ext/Skeleton";
import { EmptyState } from "@/components/ui-ext/EmptyState";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { formatDistanceToNow } from "@/lib/date";
import { listMyJobs, getEmployerStats } from "@/lib/api/employer";
import { RecruiterUpsellPanel } from "@/components/auth/RecruiterUpsellPanel";
import { useIsRecruiter } from "@/hooks/useRole";
import type { EmployerJob, JobStatus } from "@/lib/api/types";

export const Route = createFileRoute("/employer")({
  staticData: { transition: "fadeRise" },
  head: () => ({
    meta: [
      { title: "Employer Dashboard — jOBiON" },
      { name: "description", content: "Manage job postings, applicants, and views." },
    ],
  }),
  component: EmployerPage,
});

function EmployerPage() {
  const canPost = useIsRecruiter();
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <ShrinkNavbar />
      <main className="mx-auto max-w-7xl px-6 pt-32 pb-24">
        <Reveal>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.03em]">
                <GradientText>Employer</GradientText> workspace
              </h1>
              <p className="text-white/50 mt-2 max-w-xl">
                Track how your postings are performing and manage every applicant in one place.
              </p>
            </div>
            {canPost ? (
              <Link to="/employer/jobs/new">
                <GradientButton className="gap-2">
                  <Plus className="h-4 w-4" /> Post a new job
                </GradientButton>
              </Link>
            ) : null}
          </div>
        </Reveal>

        {!canPost && (
          <Reveal>
            <div className="mb-10">
              <RecruiterUpsellPanel />
            </div>
          </Reveal>
        )}

        <QueryBoundary
          fallback={
            <div className="grid gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          }
        >
          <StatsRow />
        </QueryBoundary>

        <div className="mt-10">
          <QueryBoundary
            fallback={
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-2xl" />
                ))}
              </div>
            }
          >
            <MyJobsTable />
          </QueryBoundary>
        </div>
      </main>
    </div>
  );
}

function StatsRow() {
  const { data } = useSuspenseQuery({
    queryKey: ["employer", "stats"],
    queryFn: getEmployerStats,
  });
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <KpiCard icon={<Briefcase className="h-5 w-5" />} label="Total jobs" value={data.total_jobs} />
      <KpiCard icon={<Zap className="h-5 w-5" />} label="Live jobs" value={data.live_jobs} />
      <KpiCard icon={<Eye className="h-5 w-5" />} label="Total views" value={data.total_views} />
      <KpiCard icon={<Users className="h-5 w-5" />} label="Applicants" value={data.total_applicants} />

    </div>
  );
}

const statusStyles: Record<JobStatus, string> = {
  live: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  draft: "bg-white/10 text-white/60 border-white/15",
  archived: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

function MyJobsTable() {
  const { data } = useSuspenseQuery({
    queryKey: ["employer", "jobs"],
    queryFn: listMyJobs,
  });

  if (!data.items.length) {
    return (
      <GlassPanel className="p-10">
        <EmptyState
          icon={<Sparkles className="h-6 w-6" />}
          title="No postings yet"
          description="Publish your first role and start collecting applicants in minutes."
          action={
            <GradientButton className="gap-2">
              <Plus className="h-4 w-4" /> Post a job
            </GradientButton>
          }
        />
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-white/5">
        <div>
          <h2 className="text-lg font-medium tracking-[-0.02em]">My jobs</h2>
          <p className="text-sm text-white/40">{data.total} postings total</p>
        </div>
      </div>

      {/* Header */}
      <div className="hidden md:grid grid-cols-[minmax(0,2.4fr)_100px_120px_130px_140px] gap-4 px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-white/40 border-b border-white/5 font-mono">
        <div>Role</div>
        <div>Status</div>
        <div className="text-right">Views</div>
        <div className="text-right">Applicants</div>
        <div className="text-right">Posted</div>
      </div>

      <ul className="divide-y divide-white/5">
        {data.items.map((job, i) => (
          <JobRow key={job.id} job={job} index={i} />
        ))}
      </ul>
    </GlassPanel>
  );
}

function JobRow({ job, index }: { job: EmployerJob; index: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="grid md:grid-cols-[minmax(0,2.4fr)_100px_120px_130px_140px] gap-4 items-center px-6 py-4 hover:bg-white/[0.02] transition group"
    >
      <div className="min-w-0">
        <Link
          to="/jobs/$id"
          params={{ id: job.id }}
          className="block truncate text-white font-medium group-hover:text-white transition"
        >
          {job.title}
        </Link>
        <div className="text-xs text-white/40 truncate flex items-center gap-2 mt-0.5">
          <span>{job.company.name}</span>
          <span className="text-white/20">·</span>
          <span>{job.location}</span>
          {job.remote && (
            <>
              <span className="text-white/20">·</span>
              <span className="text-primary">Remote</span>
            </>
          )}
        </div>
      </div>

      <div>
        <Badge variant="outline" className={`${statusStyles[job.status]} capitalize`}>
          {job.status}
        </Badge>
      </div>

      <div className="md:text-right font-mono text-sm text-white/70 tabular-nums">
        <span className="md:hidden text-white/40 mr-2">Views:</span>
        {job.views.toLocaleString()}
      </div>

      <div className="md:text-right font-mono text-sm tabular-nums">
        <span className="md:hidden text-white/40 mr-2">Applicants:</span>
        <Link
          to="/employer/jobs/$id/applicants"
          params={{ id: job.id }}
          className="text-white hover:text-primary transition"
        >
          {job.applicant_count}
        </Link>
        {job.new_applicants > 0 && (
          <span className="ml-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary/20 animate-pulse" />
            {job.new_applicants} new
          </span>
        )}
      </div>


      <div className="md:text-right text-xs text-white/40">
        {formatDistanceToNow(job.created_at)}
      </div>
    </motion.li>
  );
}
