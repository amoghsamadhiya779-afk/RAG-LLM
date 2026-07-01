"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

import { useAuth } from "@/hooks/use-auth";
import PostLoading from "./loading";

export default function PostJob() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!authLoading && !session) {
      router.push("/auth?redirect=/post&mode=in");
    }
  }, [authLoading, session, router]);

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
    company: companies?.find((c) => c.id === companyId) ?? { id: "c-stellar", slug: "stellar", name: "Your company", about: "", ownerId: "u-recruiter", logoUrl: null, location: null, size: null, website: null },
  };

  if (authLoading) return <PostLoading />;
  if (!session) return null;

  return (
    <div className="container-page py-10 bg-void text-bone min-h-dvh">
      <div className="mx-auto max-w-3xl pt-24">
        <h1 className="font-sans text-[48px] font-medium tracking-[-0.035em] text-paper">Post a job</h1>
        <p className="mt-1 text-[16px] text-mist">Submit your role for review. Lives in under an hour.</p>

        <div className="mt-12 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div className={`grid h-7 w-7 place-items-center rounded-full text-[13px] font-medium transition-colors ${i <= step ? "bg-paper text-void" : "bg-iron/50 text-fog"}`}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`text-[15px] ${i === step ? "font-medium text-bone" : "text-mist"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? "bg-paper" : "bg-bone/10"}`} />}
            </div>
          ))}
        </div>

        <div className="mt-8 glass-card p-8">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-6">
                <div>
                  <Label htmlFor="title" className="text-bone">Title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Senior Full-stack Engineer" className="mt-1.5 bg-void border-bone/10 text-bone placeholder:text-fog rounded-10px" />
                </div>
                <div>
                  <Label htmlFor="company" className="text-bone">Company</Label>
                  <Select value={companyId} onValueChange={setCompanyId}>
                    <SelectTrigger className="mt-1.5 bg-void border-bone/10 text-bone rounded-10px"><SelectValue placeholder={companies?.[0]?.name ?? "Select company"} /></SelectTrigger>
                    <SelectContent className="bg-char border-bone/10 text-bone">
                      {companies?.map((c) => <SelectItem key={c.id} value={c.id} className="focus:bg-iron focus:text-bone">{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="desc" className="text-bone">Description</Label>
                  <Textarea id="desc" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What you'll do, what you'll work on, who you'll work with." className="mt-1.5 bg-void border-bone/10 text-bone placeholder:text-fog rounded-10px" />
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="location" className="text-bone">Location</Label>
                    <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="New York, Remote, etc." className="mt-1.5 bg-void border-bone/10 text-bone placeholder:text-fog rounded-10px" />
                  </div>
                  <label className="mt-7 flex items-center gap-2 text-[15px] text-bone cursor-pointer">
                    <Checkbox checked={remote} onCheckedChange={(v) => setRemote(!!v)} className="border-bone/20 data-[state=checked]:bg-paper data-[state=checked]:text-void" /> Remote-friendly
                  </label>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <Label className="text-bone">Type</Label>
                    <Select value={jobType} onValueChange={(v) => setJobType(v as JobType)}>
                      <SelectTrigger className="mt-1.5 bg-void border-bone/10 text-bone rounded-10px"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-char border-bone/10 text-bone">
                        <SelectItem value="full_time" className="focus:bg-iron focus:text-bone">Full-time</SelectItem>
                        <SelectItem value="part_time" className="focus:bg-iron focus:text-bone">Part-time</SelectItem>
                        <SelectItem value="contract" className="focus:bg-iron focus:text-bone">Contract</SelectItem>
                        <SelectItem value="internship" className="focus:bg-iron focus:text-bone">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-bone">Level</Label>
                    <Select value={level} onValueChange={(v) => setLevel(v as JobLevel)}>
                      <SelectTrigger className="mt-1.5 bg-void border-bone/10 text-bone rounded-10px"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-char border-bone/10 text-bone">
                        {["intern", "junior", "mid", "senior", "staff", "principal"].map((l) => (
                          <SelectItem key={l} value={l} className="capitalize focus:bg-iron focus:text-bone">{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="smin" className="text-bone">Salary min (USD)</Label>
                    <Input id="smin" type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} className="mt-1.5 bg-void border-bone/10 text-bone rounded-10px" />
                  </div>
                  <div>
                    <Label htmlFor="smax" className="text-bone">Salary max (USD)</Label>
                    <Input id="smax" type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} className="mt-1.5 bg-void border-bone/10 text-bone rounded-10px" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-6">
                <div>
                  <Label className="text-bone">Stack tags</Label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {STACK.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTags((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t])}
                        className={`rounded-pill border px-3 py-1 text-[13px] transition-colors cursor-pointer ${tags.includes(t) ? "bg-paper text-void border-paper" : "bg-void text-mist border-bone/10 hover:bg-iron/50"}`}
                      >{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-bone">Requirements</Label>
                  <div className="mt-3 space-y-3">
                    {requirements.map((r, i) => (
                      <div key={i} className="flex gap-3">
                        <Input value={r} onChange={(e) => setRequirements((p) => p.map((x, j) => j === i ? e.target.value : x))} placeholder="e.g. 3+ years of React experience" className="bg-void border-bone/10 text-bone placeholder:text-fog rounded-10px" />
                        {requirements.length > 1 && <Button type="button" variant="outline" onClick={() => setRequirements((p) => p.filter((_, j) => j !== i))} className="rounded-10px border-bone/10 text-bone hover:bg-iron">Remove</Button>}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => setRequirements((p) => [...p, ""])} className="rounded-10px border-bone/10 text-bone hover:bg-iron">Add requirement</Button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                <p className="mb-4 text-[15px] text-mist">Preview — this is how your role will appear to candidates.</p>
                <JobCard job={preview} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-10 flex items-center justify-between border-t border-bone/[0.06] pt-6">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="text-mist hover:text-bone hover:bg-iron rounded-pill">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {step < 2 ? (
              <Button onClick={() => setStep((s) => s + 1)} className="rounded-pill bg-paper text-void hover:bg-paper/90 px-6">
                Continue <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={() => create.mutate()} disabled={create.isPending} className="rounded-pill bg-paper text-void hover:bg-paper/90 px-6">
                {create.isPending ? "Submitting…" : "Submit for review"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
