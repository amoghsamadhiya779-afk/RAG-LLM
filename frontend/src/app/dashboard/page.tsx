"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Eye, Users, ChevronRight, Sparkles, Target, Bell, LayoutDashboard } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import type { ApplicationStage, JobWithCompany } from "@/types";
import Link from "next/link";

const STAGES: { v: ApplicationStage; label: string }[] = [
  { v: "applied", label: "Applied" },
  { v: "reviewing", label: "Reviewing" },
  { v: "interview", label: "Interview" },
  { v: "offer", label: "Offer" },
];

import { Suspense } from "react";

function DashboardContent() {
  const { session } = useAuth();
  const searchParams = useSearchParams();
  const highlightParam = searchParams?.get("highlight") || "employer";

  const [activeTab, setActiveTab] = useState(highlightParam);
  const [selectedJob, setSelectedJob] = useState<JobWithCompany | null>(null);

  useEffect(() => {
    if (highlightParam) setActiveTab(highlightParam);
  }, [highlightParam]);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs", "mine", session?.user?.id],
    queryFn: () => api.jobs.mine(),
    enabled: !!session?.user?.id,
  });

  const { data: resumes = [] } = useQuery({
    queryKey: ["resumes", "mine", session?.user?.id],
    queryFn: () => api.resumes.mine(),
    enabled: !!session?.user?.id,
  });
  const resumeId = resumes[0]?.id;

  const { data: recommendedJobs, isLoading: isLoadingRecs } = useQuery({
    queryKey: ["jobs", "recommended", resumeId],
    queryFn: () => api.jobs.recommended(resumeId as string),
    enabled: !!resumeId && activeTab === "personalized-recs",
  });

  const { data: skillGaps, isLoading: isLoadingGaps } = useQuery({
    queryKey: ["insights", "skill-gap", resumeId],
    queryFn: () => api.insights.skillGap(resumeId as string),
    enabled: !!resumeId && activeTab === "skill-gap",
  });

  return (
    <div className="container-page py-10 min-h-[80vh]">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" /> Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">Manage your job applications, postings, and AI insights.</p>
        </div>
      </div>

      <div className="flex space-x-1 rounded-xl bg-surface/50 p-1 backdrop-blur-md mb-8 border border-border/50 max-w-fit">
        {[
          { id: "employer", label: "Employer Tools", icon: Users },
          { id: "personalized-recs", label: "Personalized Recs", icon: Sparkles },
          { id: "skill-gap", label: "Skill-Gap Insights", icon: Target },
          { id: "smart-alerts", label: "Smart Alerts", icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 bg-primary rounded-lg shadow-sm"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className="h-4 w-4" /> {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "employer" && (
            <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
              {isLoading ? (
                <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="glass-card h-24 animate-pulse" />)}</div>
              ) : !jobs?.length ? (
                <div className="glass-card p-10 text-center lg:col-span-2">
                  <p className="text-muted-foreground mb-4">No jobs posted yet.</p>
                  <Button onClick={() => (window.location.href = "/post")}>Post your first job</Button>
                </div>
              ) : (
                <>
                  <ul className="space-y-3">
                    {jobs.map((j) => (
                      <button
                        key={j.id}
                        onClick={() => setSelectedJob(j)}
                        className={`glass-card flex w-full items-start justify-between gap-3 p-4 text-left transition-colors hover:border-primary/40 ${selectedJob?.id === j.id ? "border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.2)]" : ""}`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate font-medium">{j.title}</h3>
                            <StatusBadge status={j.status} />
                            {j.featured && <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary"><Star className="h-2.5 w-2.5 fill-current" />Featured</span>}
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{j.views} views</span>
                            <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /><ApplicantCount jobId={j.id} /></span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 self-center text-muted-foreground" />
                      </button>
                    ))}
                  </ul>

                  {selectedJob ? <Kanban job={selectedJob} /> : (
                    <div className="glass-card grid place-items-center p-10 text-sm text-muted-foreground">
                      Select a job to see applicants
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "personalized-recs" && (
            <div className="glass-card p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 h-[300px] w-[300px] rounded-full bg-primary/10 blur-[80px] pointer-events-none" />
              <h2 className="text-2xl font-bold font-display flex items-center gap-2 mb-2">
                <Sparkles className="h-6 w-6 text-primary" /> Personalized AI Recs
              </h2>
              <p className="text-muted-foreground mb-8">Jobs ranked to your profile, not someone else's algorithm.</p>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {!resumeId ? (
                  <div className="col-span-2 p-8 text-center bg-[#1d1d1d]/50 rounded-xl border border-[#e5e5e5]/10">
                    <p className="text-[#c2c2c2] mb-4">Please upload a resume first to get personalized job recommendations.</p>
                  </div>
                ) : isLoadingRecs ? (
                  [1, 2, 3, 4].map(i => (
                    <div key={i} className="rounded-xl border border-[#e5e5e5]/10 bg-[#1d1d1d]/50 p-5 flex flex-col">
                      <div className="h-12 w-12 rounded bg-[#3d3d3d] animate-pulse mb-4" />
                      <div className="h-4 w-3/4 rounded bg-[#3d3d3d] animate-pulse mb-2" />
                      <div className="h-3 w-1/2 rounded bg-[#3d3d3d] animate-pulse mb-6" />
                    </div>
                  ))
                ) : recommendedJobs?.length ? (
                  recommendedJobs.map((job: JobWithCompany, i: number) => (
                    <div key={job.id} className="rounded-xl border border-[#e5e5e5]/10 bg-[#1d1d1d]/80 p-5 flex flex-col hover:border-[#6b62f2]/50 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="h-12 w-12 rounded bg-[#3d3d3d]/50 border border-[#e5e5e5]/10 flex items-center justify-center text-white font-bold">
                          {job.company?.name?.[0] || "U"}
                        </div>
                        <span className="bg-[#6b62f2]/20 text-[#6b62f2] text-xs px-2 py-1 rounded-full font-medium">Top Match</span>
                      </div>
                      <h3 className="font-semibold text-white truncate">{job.title}</h3>
                      <p className="text-sm text-[#b2b2b2] mb-6">{job.company?.name || "Unknown"} • {job.location || "Remote"}</p>
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="outline" className="w-full mt-auto border-[#e5e5e5]/10 hover:bg-[#3d3d3d]/50 text-white">View Match Details</Button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 p-8 text-center bg-[#1d1d1d]/50 rounded-xl border border-[#e5e5e5]/10">
                    <p className="text-[#c2c2c2]">No recommendations found right now.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "skill-gap" && (
            <div className="glass-card p-10 relative overflow-hidden">
              <h2 className="text-2xl font-bold font-display flex items-center gap-2 mb-2">
                <Target className="h-6 w-6 text-primary" /> Skill-Gap Insights
              </h2>
              <p className="text-muted-foreground mb-8">See which skills unlock the next tier of roles you want.</p>
              
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  {!resumeId ? (
                    <div className="p-8 text-center bg-[#1d1d1d]/50 rounded-xl border border-[#e5e5e5]/10">
                      <p className="text-[#c2c2c2]">Please upload a resume first to get your skill-gap analysis.</p>
                    </div>
                  ) : isLoadingGaps ? (
                    <div className="space-y-4">
                      {[1, 2].map(i => (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-2">
                            <div className="h-4 w-24 bg-[#3d3d3d] rounded animate-pulse" />
                            <div className="h-4 w-20 bg-[#3d3d3d] rounded animate-pulse" />
                          </div>
                          <div className="h-2 w-full bg-[#3d3d3d]/50 rounded-full overflow-hidden">
                            <div className="h-full bg-[#3d3d3d] w-1/3 rounded-full animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : skillGaps?.length ? (
                    skillGaps.map((gap: any, i: number) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium text-white">{gap.skill}</span>
                          <span className="text-[#6b62f2] font-medium">{gap.impact}</span>
                        </div>
                        <div className="h-2 w-full bg-[#3d3d3d]/50 rounded-full overflow-hidden">
                          <div className="h-full bg-[#6b62f2]" style={{ width: `${gap.progress || 10}%` }} />
                        </div>
                        <p className="text-xs text-[#b2b2b2] mt-2">{gap.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center bg-[#1d1d1d]/50 rounded-xl border border-[#e5e5e5]/10">
                      <p className="text-[#c2c2c2]">No skill gaps identified. You're fully matched!</p>
                    </div>
                  )}
                </div>
                
                <div className="rounded-xl border border-dashed border-[#6b62f2]/30 bg-[#6b62f2]/5 p-6 flex flex-col justify-center items-center text-center">
                  <Target className="h-10 w-10 text-[#6b62f2] mb-4" />
                  <h3 className="font-semibold mb-2 text-white">Unlock Senior Roles</h3>
                  <p className="text-sm text-[#b2b2b2] mb-4">Mastering these missing skills will significantly increase your match rate for top-tier roles.</p>
                  <Button size="sm" className="bg-[#6b62f2] hover:bg-[#5b52e2] text-white">Explore Learning Paths</Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "smart-alerts" && (
            <div className="glass-card p-10 relative overflow-hidden">
              <h2 className="text-2xl font-bold font-display flex items-center gap-2 mb-2">
                <Bell className="h-6 w-6 text-primary" /> Smart Job Alerts
              </h2>
              <p className="text-muted-foreground mb-8">Weekly digests for the exact roles you described, semantically matched.</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface/50">
                  <div>
                    <h4 className="font-medium">"Remote Senior React roles on AI teams"</h4>
                    <p className="text-xs text-muted-foreground mt-1">Semantic Match • Weekly Digest</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-full">Active</span>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface/50">
                  <div>
                    <h4 className="font-medium">"Machine Learning internships in NY"</h4>
                    <p className="text-xs text-muted-foreground mt-1">Lexical Match • Daily Alerts</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">Paused</span>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full border-dashed mt-4 gap-2">
                  <Bell className="h-4 w-4" /> Create New Smart Alert
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
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
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">{job.title}</h2>
        {!job.featured && <Button size="sm" onClick={() => feature.mutate()} disabled={feature.isPending}><Star className="h-3.5 w-3.5" /> Feature this job</Button>}
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {STAGES.map((s) => {
          const items = apps.filter((a: any) => a.stage === s.v);
          return (
            <div key={s.v} className="glass-card flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{s.label}</span>
                <span className="rounded bg-secondary px-1.5 py-0.5 text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((a: any) => (
                  <motion.div layoutId={a.id} key={a.id} className="rounded-md border border-border bg-surface/60 p-2 text-xs">
                    <div className="font-medium">{a.applicant?.fullName ?? "Anonymous"}</div>
                    <div className="text-muted-foreground">{a.applicant?.headline ?? "Applicant"}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {STAGES.filter((x) => x.v !== a.stage).map((x) => (
                        <button
                          key={x.v}
                          onClick={() => setStage.mutate({ id: a.id, stage: x.v })}
                          className="rounded bg-secondary px-1.5 py-0.5 text-[10px] hover:bg-primary hover:text-primary-foreground transition-colors"
                        >→ {x.label}</button>
                      ))}
                    </div>
                  </motion.div>
                ))}
                {items.length === 0 && <div className="rounded border border-dashed border-border p-3 text-center text-[11px] text-muted-foreground">Empty</div>}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="container-page py-10 animate-pulse h-[80vh] bg-muted/20 rounded-xl" />}>
      <DashboardContent />
    </Suspense>
  );
}
