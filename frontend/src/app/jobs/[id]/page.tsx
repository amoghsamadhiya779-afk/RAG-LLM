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
import { toast } from "sonner";

export default function JobDetail() {
  const params = useParams();
  const jobId = params.id as string;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ["jobs", jobId],
    queryFn: () => api.jobs.get(jobId),
  });

  const { data: similar } = useQuery({
    queryKey: ["jobs", "similar", jobId],
    queryFn: () => api.jobs.similar(jobId),
    enabled: !!jobId,
  });

  const toggleSave = () => {
    setIsSaved(!isSaved);
    toast.success(!isSaved ? "Job saved" : "Job removed");
  };

  if (isLoading) {
    return (
      <div className="container-page py-10 animate-pulse min-h-[600px] bg-char rounded-2xl" />
    );
  }

  if (!job) {
    return (
      <div className="container-page py-20 text-center bg-void text-bone min-h-dvh">
        <h1 className="font-geist text-3xl font-bold text-paper">Job not found</h1>
        <Link href="/jobs" className="mt-4 text-mist hover:text-bone hover:underline block">Return to jobs</Link>
      </div>
    );
  }

  return (
    <div className="bg-void min-h-dvh text-bone pt-24 pb-10">
      <div className="container-page">
        <Link href="/jobs" className="inline-flex items-center gap-2 text-[14px] text-mist hover:text-bone transition-colors bg-char/50 px-3 py-1.5 rounded-pill border border-bone/10">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to jobs
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <header className="glass-card p-8">
              <div className="flex items-start gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-char border border-bone/10 text-[24px] font-semibold text-bone">
                  {job.company.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="font-sans text-[36px] tracking-[-0.035em] font-medium text-paper leading-tight">{job.title}</h1>
                  <Link href={`/companies/${job.company.id || job.company.slug}`} className="mt-2 inline-block text-[16px] text-mist hover:text-bone transition-colors">
                    {job.company.name}
                  </Link>
                  <div className="mt-5 flex flex-wrap items-center gap-4 text-[14px] text-fog">
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-ash" />{job.remote ? "Remote" : job.location ?? "—"}</span>
                    <span className="inline-flex items-center gap-1.5"><Briefcase className="h-4 w-4 text-ash" />{job.jobType.replace("_", "-")}</span>
                    <span className="capitalize">{job.level}</span>
                    {(job.salaryMin || job.salaryMax) && <span className="text-bone">${(job.salaryMin ?? 0).toLocaleString()}–${(job.salaryMax ?? 0).toLocaleString()}</span>}
                    {job.featured && <span className="inline-flex items-center gap-1 rounded-pill bg-indigo-haze/20 px-3 py-1 text-[12px] text-bone border border-indigo-haze/30"><Star className="h-3 w-3 fill-current" />Featured</span>}
                  </div>
                </div>
              </div>
            </header>

            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="glass-card mt-6 p-8">
              <h2 className="font-geist text-[24px] font-medium text-paper">About the role</h2>
              <p className="mt-4 whitespace-pre-line text-[16px] leading-relaxed text-mist">{job.description}</p>
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="glass-card mt-6 p-8">
              <h2 className="font-geist text-[24px] font-medium text-paper">What we're looking for</h2>
              <ul className="mt-4 space-y-3 text-[16px] text-mist">
                {job.requirements.map((r: string) => (
                  <li key={r} className="flex gap-3"><span className="text-indigo-haze mt-1">•</span><span>{r}</span></li>
                ))}
              </ul>
            </motion.section>

            {job.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {job.tags.map((t: string) => <span key={t} className="rounded-pill border border-bone/10 bg-iron/40 px-3 py-1.5 text-[14px] text-mist">{t}</span>)}
              </div>
            )}
          </motion.article>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="glass-card p-6 border-bone/10">
              <Button size="lg" className="w-full rounded-pill bg-paper text-void hover:bg-paper/90 text-[16px]" onClick={() => setOpen(true)}>Apply now</Button>
              <Button size="lg" variant="outline" className="mt-3 w-full gap-2 rounded-pill border-bone/20 text-bone hover:bg-iron" onClick={toggleSave}>
                {isSaved ? <><BookmarkCheck className="h-4 w-4" /> Saved</> : <><Bookmark className="h-4 w-4" /> Save job</>}
              </Button>
              <div className="mt-8 space-y-3 pt-6 border-t border-bone/[0.06] text-[14px] text-fog text-center">
                <div>Posted {new Date(job.createdAt).toLocaleDateString()}</div>
                <div>{job.views.toLocaleString()} views</div>
              </div>
            </div>
          </aside>
        </div>

        {similar && similar.length > 0 && (
          <section className="mt-20">
            <h2 className="mb-8 font-sans tracking-[-0.035em] text-[32px] font-medium text-paper">Similar roles</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((j) => <JobCard key={j.id} job={j} />)}
            </div>
          </section>
        )}

        <ApplyDialog open={open} onOpenChange={setOpen} jobId={job.id} jobTitle={job.title} />
      </div>
    </div>
  );
}
