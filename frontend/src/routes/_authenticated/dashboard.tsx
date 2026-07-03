import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Eye, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import type { Application, ApplicationStage, JobWithCompany } from "@/types";

const STAGES: { v: ApplicationStage; label: string }[] = [
  { v: "applied", label: "Applied" },
  { v: "reviewing", label: "Reviewing" },
  { v: "interview", label: "Interview" },
  { v: "offer", label: "Offer" },
];

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — jOBiON" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { session } = useAuth();
  const [selectedJob, setSelectedJob] = useState<JobWithCompany | null>(null);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs", "mine", session?.user.id],
    queryFn: () => api.jobs.mine(),
    enabled: !!session,
  });

  return (
    <div className="min-h-dvh flex flex-col">
      <SiteHeader />
      <main className="flex-1 container-page py-10">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-h2 font-display">Dashboard</h1>
            <p className="mt-1 text-small text-secondary">Your posted roles and applicants.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="glass-card h-24 animate-pulse" />)}</div>
        ) : !jobs?.length ? (
          <div className="mt-12 glass-card p-10 text-center">
            <p className="text-secondary">No jobs posted yet.</p>
            <Button className="mt-4" onClick={() => (window.location.href = "/post")}>Post your first job</Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_2fr]">
            <ul className="space-y-3">
              {jobs.map((j) => (
                <button
                  key={j.id}
                  onClick={() => setSelectedJob(j)}
                  className={`glass-card flex w-full items-start justify-between gap-3 p-4 text-left transition-colors hover:border-primary/40 ${selectedJob?.id === j.id ? "border-primary/50" : ""}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-ui">{j.title}</h3>
                      <StatusBadge status={j.status} />
                      {j.featured && <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary"><Star className="h-2.5 w-2.5 fill-current" />Featured</span>}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-micro text-secondary">
                      <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{j.views}</span>
                      <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /><ApplicantCount jobId={j.id} /></span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 self-center text-secondary" />
                </button>
              ))}
            </ul>

            {selectedJob ? <Kanban job={selectedJob} /> : (
              <div className="glass-card grid place-items-center p-10 text-small text-secondary">
                Select a job to see applicants
              </div>
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === "live" ? "bg-primary/15 text-primary" : status === "pending" ? "bg-accent/15 text-accent-foreground" : "bg-destructive/15 text-destructive";
  return <span className={`rounded-full px-1.5 py-0.5 text-[10px] capitalize ${cls}`}>{status}</span>;
}

function ApplicantCount({ jobId }: { jobId: string }) {
  const { data } = useQuery({ queryKey: ["apps", jobId], queryFn: () => api.applications.listForJob(jobId) });
  return <>{data?.length ?? 0}</>;
}

function Kanban({ job }: { job: JobWithCompany }) {
  const qc = useQueryClient();
  const { data: apps = [] } = useQuery({ queryKey: ["apps", job.id], queryFn: () => api.applications.listForJob(job.id) });

  const setStage = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: ApplicationStage }) => api.applications.setStage(id, stage),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apps", job.id] }),
  });

  const feature = useMutation({
    mutationFn: () => api.billing.featureJob(job.id),
    onSuccess: () => {
      toast.success("Job promoted to Featured");
      qc.invalidateQueries({ queryKey: ["jobs", "mine"] });
    },
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-body-lg font-heading">{job.title}</h2>
        {!job.featured && <Button size="sm" onClick={() => feature.mutate()} disabled={feature.isPending}><Star className="h-3.5 w-3.5" /> Feature this job</Button>}
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {STAGES.map((s) => {
          const items = apps.filter((a) => a.stage === s.v);
          return (
            <div key={s.v} className="glass-card flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between text-micro">
                <span className="font-ui">{s.label}</span>
                <span className="rounded bg-secondary px-1.5 py-0.5 text-secondary">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((a) => (
                  <motion.div layoutId={a.id} key={a.id} className="rounded-md border border-border bg-surface/60 p-2 text-micro">
                    <div className="font-ui">{a.applicant?.fullName ?? "Anonymous"}</div>
                    <div className="text-secondary">{a.applicant?.headline ?? "Applicant"}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {STAGES.filter((x) => x.v !== a.stage).map((x) => (
                        <button
                          key={x.v}
                          onClick={() => setStage.mutate({ id: a.id, stage: x.v })}
                          className="rounded bg-secondary px-1.5 py-0.5 text-[10px] hover:bg-primary hover:text-primary-foreground"
                        >→ {x.label}</button>
                      ))}
                    </div>
                  </motion.div>
                ))}
                {items.length === 0 && <div className="rounded border border-dashed border-border p-3 text-center text-[11px] text-secondary">Empty</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Avoid unused-import warnings in case React tree-shakes
export type _Application = Application;
