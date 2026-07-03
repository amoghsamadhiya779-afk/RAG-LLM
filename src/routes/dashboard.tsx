import { GuestBanner } from "@/components/auth/GuestBanner";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { Briefcase, FileText, Bookmark, Sparkles, ArrowRight } from "lucide-react";
import { ShrinkNavbar } from "@/components/fx/ShrinkNavbar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ProfileRing } from "@/components/dashboard/ProfileRing";
import { ApplicationsTable } from "@/components/dashboard/ApplicationsTable";
import { JobCard } from "@/components/jobs/JobCard";
import { Skeleton } from "@/components/ui-ext/Skeleton";
import { EmptyState } from "@/components/ui-ext/EmptyState";
import { ErrorState } from "@/components/ui-ext/ErrorState";
import { listApplications } from "@/lib/api/applications";
import { listJobs, listSavedJobs } from "@/lib/api/jobs";
import { getMe } from "@/lib/api/me";

export const Route = createFileRoute("/dashboard")({
  staticData: { transition: "fadeRise" },
  head: () => ({
    meta: [
      { title: "Dashboard — jOBiON" },
      { name: "description", content: "Your applications, saved jobs, and recommended roles." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(meQO);
    context.queryClient.ensureQueryData(applicationsQO);
    context.queryClient.ensureQueryData(savedQO);
    context.queryClient.ensureQueryData(recommendedQO);
  },
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen grid place-items-center p-6">
      <ErrorState error={error} onRetry={reset} />
    </div>
  ),
  component: DashboardPage,
});

const meQO = queryOptions({ queryKey: ["me"], queryFn: getMe, staleTime: 60_000 });
const applicationsQO = queryOptions({
  queryKey: ["applications"],
  queryFn: listApplications,
  staleTime: 30_000,
});
const savedQO = queryOptions({
  queryKey: ["jobs", "saved"],
  queryFn: listSavedJobs,
  staleTime: 30_000,
});
const recommendedQO = queryOptions({
  queryKey: ["jobs", "recommended"],
  queryFn: () => listJobs({ page: 1, page_size: 6 }),
  staleTime: 60_000,
});

function computeProfile(me: Awaited<ReturnType<typeof getMe>>) {
  const items: { key: string; label: string; done: boolean }[] = [
    { key: "name", label: "Add your full name", done: !!me.full_name },
    { key: "avatar", label: "Upload an avatar", done: !!me.avatar_url },
    { key: "resume", label: "Upload a resume", done: false },
    { key: "ats", label: "Run your first ATS scan", done: false },
    { key: "prefs", label: "Set job preferences", done: false },
  ];
  const done = items.filter((i) => i.done).length;
  const percent = (done / items.length) * 100;
  const missing = items.filter((i) => !i.done).map((i) => i.label);
  return { percent, missing };
}

function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <ShrinkNavbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-24 space-y-10">
        <GuestBanner />
        <Suspense fallback={<HeaderSkeleton />}>
          <Header />
        </Suspense>

        <Suspense fallback={<KpiSkeleton />}>
          <KpiRow />
        </Suspense>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <section>
              <SectionHead title="Recommended for you" href="/jobs" ctaLabel="Browse all" />
              <Suspense fallback={<RecommendedSkeleton />}>
                <Recommended />
              </Suspense>
            </section>

            <section>
              <SectionHead title="Recent applications" href="/jobs" ctaLabel="Find more" />
              <Suspense fallback={<TableSkeleton />}>
                <Applications />
              </Suspense>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-xl border bg-card p-6">
              <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-muted" />}>
                <Profile />
              </Suspense>
            </section>

            <section>
              <SectionHead title="Saved jobs" />
              <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-muted" />}>
                <Saved />
              </Suspense>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Header() {
  const { data: me } = useSuspenseQuery(meQO);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="text-xs uppercase tracking-wider text-muted-foreground">Dashboard</div>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">
        Welcome back{me.full_name ? `, ${me.full_name.split(" ")[0]}` : ""}.
      </h1>
      <p className="mt-2 text-muted-foreground">Here's what's moving on your job search.</p>
    </motion.div>
  );
}
function HeaderSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-9 w-80" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}

function KpiRow() {
  const { data: apps } = useSuspenseQuery(applicationsQO);
  const { data: saved } = useSuspenseQuery(savedQO);
  const { data: recs } = useSuspenseQuery(recommendedQO);
  const interviews = apps.items.filter((a) => a.status === "interview").length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Applications" value={apps.total} hint="all time" icon={<FileText className="h-4 w-4" />} />
      <KpiCard label="Interviews" value={interviews} hint="active" icon={<Sparkles className="h-4 w-4" />} delta={interviews > 0 ? "+1 this week" : undefined} />
      <KpiCard label="Saved jobs" value={saved.total} hint="in your list" icon={<Bookmark className="h-4 w-4" />} />
      <KpiCard label="New matches" value={recs.total} hint="fresh this week" icon={<Briefcase className="h-4 w-4" />} />
    </div>
  );
}
function KpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
  );
}

function Recommended() {
  const { data } = useSuspenseQuery(recommendedQO);
  if (!data.items.length) {
    return <EmptyState title="No matches yet" description="Add a resume to get personalized picks." />;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {data.items.slice(0, 4).map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
function RecommendedSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-48 rounded-xl" />
      ))}
    </div>
  );
}

function Applications() {
  const { data } = useSuspenseQuery(applicationsQO);
  return <ApplicationsTable applications={data.items} />;
}
function TableSkeleton() {
  return <Skeleton className="h-56 rounded-xl" />;
}

function Profile() {
  const { data: me } = useSuspenseQuery(meQO);
  const { percent, missing } = computeProfile(me);
  return <ProfileRing percent={percent} missing={missing} />;
}

function Saved() {
  const { data } = useSuspenseQuery(savedQO);
  if (!data.items.length) {
    return (
      <EmptyState
        icon={<Bookmark className="h-6 w-6" />}
        title="No saved jobs"
        description="Tap the heart on any job to save it here."
      />
    );
  }
  return (
    <div className="space-y-3">
      {data.items.slice(0, 4).map((job) => (
        <Link
          key={job.id}
          to="/jobs/$id"
          params={{ id: job.id }}
          className="block rounded-xl border bg-card p-4 hover:border-foreground/30 transition-colors"
        >
          <div className="font-medium text-sm">{job.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {job.company.name} · {job.location}
          </div>
        </Link>
      ))}
    </div>
  );
}

function SectionHead({ title, href, ctaLabel }: { title: string; href?: string; ctaLabel?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {href && ctaLabel && (
        <Link to={href} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          {ctaLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
