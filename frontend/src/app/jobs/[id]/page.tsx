"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Briefcase, Star, ArrowLeft, Bookmark, BookmarkCheck } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/site/job-card";
import { ApplyDialog } from "@/components/site/apply-dialog";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function JobDetail() {
  const params = useParams();
  const jobId = params.id as string;
  const { session } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ["jobs", jobId],
    queryFn: () => api.jobs.get(jobId),
  });

  const { data: similar } = useQuery({
    queryKey: ["jobs", "similar", jobId],
    queryFn: () => api.jobs.similar(jobId),
    enabled: !!jobId,
  });

  const { data: savedIds } = useQuery({
    queryKey: ["saved", "ids", session?.user.id],
    queryFn: () => session ? api.saved.ids() : Promise.resolve([] as string[]),
    enabled: !!session,
  });
  
  const isSaved = !!savedIds?.includes(jobId);

  const toggleSave = useMutation({
    mutationFn: () => {
      if (!session) throw new Error("Sign in to save jobs");
      return api.saved.toggle(jobId);
    },
    onSuccess: (res) => {
      toast.success(res.saved ? "Saved" : "Removed");
      qc.invalidateQueries({ queryKey: ["saved"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="container-page py-10 animate-pulse h-[600px] bg-muted/20 rounded-xl" />
    );
  }

  if (!job) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold">Job not found</h1>
        <Link href="/jobs" className="mt-4 text-primary hover:underline block">Return to jobs</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <Link href="/jobs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to jobs
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <header className="glass-card p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-surface-elevated border border-border text-lg font-semibold text-muted-foreground">
                {job.company.name[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-3xl font-bold">{job.title}</h1>
                <Link href={`/companies/${job.company.id || job.company.slug}`} className="mt-1 inline-block text-sm text-muted-foreground hover:text-primary">
                  {job.company.name}
                </Link>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.remote ? "Remote" : job.location ?? "—"}</span>
                  <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{job.jobType.replace("_", "-")}</span>
                  <span className="capitalize">{job.level}</span>
                  {(job.salaryMin || job.salaryMax) && <span className="text-primary">${(job.salaryMin ?? 0).toLocaleString()}–${(job.salaryMax ?? 0).toLocaleString()}</span>}
                  {job.featured && <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] text-primary"><Star className="h-3 w-3 fill-current" />Featured</span>}
                </div>
              </div>
            </div>
          </header>

          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="glass-card mt-6 p-6">
            <h2 className="font-display text-xl font-semibold">About the role</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{job.description}</p>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="glass-card mt-6 p-6">
            <h2 className="font-display text-xl font-semibold">What we're looking for</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {job.requirements.map((r: string) => (
                <li key={r} className="flex gap-2"><span className="text-primary">•</span><span>{r}</span></li>
              ))}
            </ul>
          </motion.section>

          {job.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-1.5">
              {job.tags.map((t: string) => <span key={t} className="rounded-md bg-secondary px-2 py-1 text-xs">{t}</span>)}
            </div>
          )}
        </motion.article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="glass-card p-6">
            <Button size="lg" className="w-full" onClick={() => setOpen(true)}>Apply now</Button>
            <Button size="lg" variant="outline" className="mt-2 w-full gap-2" onClick={() => toggleSave.mutate()} disabled={toggleSave.isPending}>
              {isSaved ? <><BookmarkCheck className="h-4 w-4" /> Saved</> : <><Bookmark className="h-4 w-4" /> Save job</>}
            </Button>
            <div className="mt-6 space-y-2 text-xs text-muted-foreground">
              <div>Posted {new Date(job.createdAt).toLocaleDateString()}</div>
              <div>{job.views.toLocaleString()} views</div>
            </div>
          </div>
        </aside>
      </div>

      {similar && similar.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-4 font-display text-2xl font-semibold">Similar roles</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((j) => <JobCard key={j.id} job={j} />)}
          </div>
        </section>
      )}

      <ApplyDialog open={open} onOpenChange={setOpen} jobId={job.id} jobTitle={job.title} />
    </div>
  );
}
