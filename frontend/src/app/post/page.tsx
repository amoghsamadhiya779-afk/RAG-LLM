"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JobCard } from "@/components/site/job-card";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import type { JobLevel, JobType, JobWithCompany } from "@/types";

const STACK = ["TypeScript", "React", "Next.js", "Node.js", "Go", "Rust", "Python", "PyTorch", "Postgres", "Kubernetes", "AWS", "GraphQL", "OpenTelemetry"];

const schema = z.object({
  title: z.string().trim().min(4).max(120),
  description: z.string().trim().min(40).max(5000),
  location: z.string().trim().max(120).optional(),
  remote: z.boolean(),
  jobType: z.enum(["full_time", "part_time", "contract", "internship"]),
  level: z.enum(["intern", "junior", "mid", "senior", "staff", "principal"]),
  salaryMin: z.number().int().nullable(),
  salaryMax: z.number().int().nullable(),
  tags: z.array(z.string()).max(10),
  requirements: z.array(z.string().min(2)).min(1).max(10),
  companyId: z.string(),
});

export default function PostJob() {
  const { session } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!session) {
      router.push("/auth");
    }
  }, [session, router]);

  const [step, setStep] = useState(0);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState(true);
  const [jobType, setJobType] = useState<JobType>("full_time");
  const [level, setLevel] = useState<JobLevel>("mid");
  const [salaryMin, setSalaryMin] = useState<string>("");
  const [salaryMax, setSalaryMax] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<string[]>([""]);

  const { data: companies } = useQuery({ queryKey: ["companies"], queryFn: () => api.companies.list() });
  const [companyId, setCompanyId] = useState<string>("");

  const create = useMutation({
    mutationFn: async () => {
      const payload = schema.parse({
        title,
        description,
        location: location || undefined,
        remote,
        jobType,
        level,
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        tags,
        requirements: requirements.filter((r) => r.trim().length > 1),
        companyId: companyId || companies?.[0]?.id || "c-stellar",
      });
      return api.jobs.create({ ...payload, location: payload.location ?? null });
    },
    onSuccess: () => {
      toast.success("Job submitted for review");
      router.push("/dashboard");
    },
    onError: (e) => {
      const msg = e instanceof z.ZodError ? e.issues[0].message : e instanceof Error ? e.message : "Failed";
      toast.error(msg);
    },
  });

  const STEPS = ["Details", "Requirements", "Preview"] as const;

  const preview: JobWithCompany = {
    id: "preview",
    companyId,
    title: title || "Your job title",
    description,
    requirements,
    location: location || null,
    remote,
    jobType,
    level,
    salaryMin: salaryMin ? Number(salaryMin) : null,
    salaryMax: salaryMax ? Number(salaryMax) : null,
    tags,
    status: "pending",
    featured: false,
    views: 0,
    createdAt: new Date().toISOString(),
    company: companies?.find((c) => c.id === companyId) ?? { id: "c-stellar", slug: "stellar", name: "Your company", about: "", ownerId: session?.user?.id ?? "", logoUrl: null, location: null, size: null, website: null },
  };

  if (!session) return null;

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-bold">Post a job</h1>
        <p className="mt-1 text-sm text-muted-foreground">Submit your role for review. Lives in under an hour.</p>

        <div className="mt-8 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div className={`grid h-7 w-7 place-items-center rounded-full text-xs font-medium ${i <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`text-sm ${i === step ? "font-medium" : "text-muted-foreground"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="mt-8 glass-card p-6">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Senior Full-stack Engineer" />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Select value={companyId} onValueChange={setCompanyId}>
                    <SelectTrigger><SelectValue placeholder={companies?.[0]?.name ?? "Select company"} /></SelectTrigger>
                    <SelectContent>
                      {companies?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="desc">Description</Label>
                  <Textarea id="desc" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What you'll do, what you'll work on, who you'll work with." />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="New York, Remote, etc." />
                  </div>
                  <label className="mt-7 flex items-center gap-2 text-sm">
                    <Checkbox checked={remote} onCheckedChange={(v) => setRemote(!!v)} /> Remote-friendly
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Type</Label>
                    <Select value={jobType} onValueChange={(v) => setJobType(v as JobType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full-time</SelectItem>
                        <SelectItem value="part_time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Level</Label>
                    <Select value={level} onValueChange={(v) => setLevel(v as JobLevel)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["intern", "junior", "mid", "senior", "staff", "principal"].map((l) => (
                          <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="smin">Salary min (USD)</Label>
                    <Input id="smin" type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="smax">Salary max (USD)</Label>
                    <Input id="smax" type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-4">
                <div>
                  <Label>Stack tags</Label>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {STACK.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTags((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t])}
                        className={`rounded-md px-2 py-1 text-xs transition-colors ${tags.includes(t) ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                      >{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Requirements</Label>
                  <div className="mt-2 space-y-2">
                    {requirements.map((r, i) => (
                      <div key={i} className="flex gap-2">
                        <Input value={r} onChange={(e) => setRequirements((p) => p.map((x, j) => j === i ? e.target.value : x))} placeholder="e.g. 3+ years of React experience" />
                        {requirements.length > 1 && <Button type="button" variant="outline" onClick={() => setRequirements((p) => p.filter((_, j) => j !== i))}>Remove</Button>}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => setRequirements((p) => [...p, ""])}>Add requirement</Button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                <p className="mb-3 text-sm text-muted-foreground">Preview — this is how your role will appear to candidates.</p>
                <JobCard job={preview} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            {step < 2 ? (
              <Button onClick={() => setStep((s) => s + 1)}>Continue <ChevronRight className="h-4 w-4" /></Button>
            ) : (
              <Button onClick={() => create.mutate()} disabled={create.isPending}>{create.isPending ? "Submitting…" : "Submit for review"}</Button>
            )}
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Already have an account? <Link href="/auth" className="underline">Sign in</Link>.
        </p>
      </div>
    </div>
  );
}
