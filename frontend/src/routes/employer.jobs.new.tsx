import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  DollarSign,
  ExternalLink,
  Loader2,
  MapPin,
  Tag,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { ShrinkNavbar } from "@/components/fx/ShrinkNavbar";
import { GlassPanel } from "@/components/ui-ext/GlassPanel";
import { GradientText } from "@/components/ui-ext/GradientText";
import { GradientButton } from "@/components/ui-ext/GradientButton";
import { Reveal } from "@/components/ui-ext/motion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createJob, type CreateJobInput } from "@/lib/api/employer";
import { BackButton } from "@/components/layout/BackButton";

export const Route = createFileRoute("/employer/jobs/new")({
  head: () => ({
    meta: [
      { title: "Post a job — jOBiON" },
      { name: "description", content: "Publish a new role with a live preview. Free — no featured upsell." },
    ],
  }),
  component: NewJobPage,
});

const seniorityValues = ["intern", "junior", "mid", "senior", "staff", "principal"] as const;
const employmentValues = ["full_time", "part_time", "contract", "internship"] as const;

const schema = z
  .object({
    title: z.string().trim().min(3, "Title is required").max(120),
    company_name: z.string().trim().min(2, "Company name is required").max(80),
    location: z.string().trim().min(2, "Location is required").max(80),
    remote: z.boolean(),
    seniority: z.enum(seniorityValues),
    employment_type: z.enum(employmentValues),
    tags_raw: z.string().max(300),
    description_md: z.string().trim().min(40, "Add at least a short description").max(8000),
    apply_url: z.union([z.string().trim().url("Must be a valid URL").max(500), z.literal("")]),
    salary_min: z.coerce.number().int().nonnegative().max(10_000_000).or(z.nan()),
    salary_max: z.coerce.number().int().nonnegative().max(10_000_000).or(z.nan()),
    currency: z.string().length(3),
  })
  .refine(
    (v) =>
      !v.salary_min ||
      !v.salary_max ||
      Number.isNaN(v.salary_min) ||
      Number.isNaN(v.salary_max) ||
      v.salary_max >= v.salary_min,
    { path: ["salary_max"], message: "Max must be ≥ min" },
  );

type FormValues = z.output<typeof schema>;

const defaultValues: FormValues = {
  title: "",
  company_name: "",
  location: "Remote",
  remote: true,
  seniority: "senior",
  employment_type: "full_time",
  tags_raw: "React, TypeScript",
  description_md:
    "## About the role\n\nWe're hiring a senior engineer to help us ship product with taste. You'll own features end-to-end.\n\n### What you'll do\n- Ship high-quality UI\n- Collaborate with design + product\n- Care about craft",
  apply_url: "",
  salary_min: 140000 as unknown as number,
  salary_max: 200000 as unknown as number,
  currency: "USD",
};

function NewJobPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues,
    mode: "onBlur",
  });

  const values = form.watch();
  const tags = useMemo(
    () =>
      (values.tags_raw ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 12),
    [values.tags_raw],
  );

  const createMutation = useMutation({ mutationFn: createJob });

  const onSubmit = async (v: FormValues) => {
    setSubmitting(true);
    try {
      const payload: CreateJobInput = {
        title: v.title,
        company_name: v.company_name,
        location: v.location,
        remote: v.remote,
        seniority: v.seniority,
        employment_type: v.employment_type,
        tags,
        description_md: v.description_md,
        apply_url: v.apply_url ? v.apply_url : null,
        salary_min: Number.isFinite(v.salary_min) ? Number(v.salary_min) : null,
        salary_max: Number.isFinite(v.salary_max) ? Number(v.salary_max) : null,
        currency: v.currency || "USD",
      };
      await createMutation.mutateAsync(payload);
      toast.success("Submitted for review", {
        description: "Your job is pending and will go live shortly.",
      });
      navigate({ to: "/employer" });
    } catch (err) {
      toast.error("Could not post job", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <ShrinkNavbar />
      <main className="mx-auto max-w-7xl px-6 pt-32 pb-24">
        <BackButton fallback="/employer" className="mb-6" />
        <Reveal>
          <Link
            to="/employer"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to employer
          </Link>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.03em]">
            Post a <GradientText>new job</GradientText>
          </h1>
          <p className="text-white/50 mt-2 max-w-xl">
            Fill the form on the left; the preview on the right updates as you type. Posting is free.
          </p>
        </Reveal>

        <form
          onSubmit={form.handleSubmit(onSubmit as never)}
          className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
        >
          <GlassPanel className="p-6 md:p-8 space-y-6">
            <Field label="Job title" error={form.formState.errors.title?.message}>
              <Input placeholder="Senior Frontend Engineer" {...form.register("title")} />
            </Field>

            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Company" error={form.formState.errors.company_name?.message}>
                <Input placeholder="Acme, Inc." {...form.register("company_name")} />
              </Field>
              <Field label="Location" error={form.formState.errors.location?.message}>
                <Input placeholder="San Francisco" {...form.register("location")} />
              </Field>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Field label="Seniority">
                <Select
                  value={values.seniority}
                  onValueChange={(v) => form.setValue("seniority", v as never)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {seniorityValues.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Employment">
                <Select
                  value={values.employment_type}
                  onValueChange={(v) => form.setValue("employment_type", v as never)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {employmentValues.map((s) => (
                      <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Remote">
                <div className="flex items-center gap-3 h-10">
                  <Switch
                    checked={values.remote}
                    onCheckedChange={(v) => form.setValue("remote", v)}
                  />
                  <span className="text-sm text-white/60">
                    {values.remote ? "Remote-friendly" : "On-site only"}
                  </span>
                </div>
              </Field>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_1fr_120px]">
              <Field label="Salary min" error={form.formState.errors.salary_min?.message as string | undefined}>
                <Input type="number" placeholder="140000" {...form.register("salary_min")} />
              </Field>
              <Field label="Salary max" error={form.formState.errors.salary_max?.message as string | undefined}>
                <Input type="number" placeholder="200000" {...form.register("salary_max")} />
              </Field>
              <Field label="Currency">
                <Input maxLength={3} {...form.register("currency")} />
              </Field>
            </div>

            <Field label="Tags (comma separated)">
              <Input placeholder="React, TypeScript, Next.js" {...form.register("tags_raw")} />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((t) => (
                    <Badge key={t} variant="outline" className="border-white/10 text-white/70 font-mono text-[10px]">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </Field>

            <Field label="Apply URL (optional)" error={form.formState.errors.apply_url?.message}>
              <Input placeholder="https://…" {...form.register("apply_url")} />
            </Field>

            <Field label="Description (Markdown)" error={form.formState.errors.description_md?.message}>
              <Textarea rows={10} className="font-mono text-sm" {...form.register("description_md")} />
            </Field>

            <div className="flex items-center gap-3 pt-2">
              <GradientButton type="submit" disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                ) : (
                  <>Submit for review</>
                )}
              </GradientButton>
              <span className="text-xs text-white/40">
                Status will be <span className="text-amber-300">pending</span> until approved.
              </span>
            </div>
          </GlassPanel>

          <div className="lg:sticky lg:top-28 self-start">
            <div className="text-[10px] uppercase tracking-[0.24em] text-white/40 font-mono mb-3">Live preview</div>
            <JobPreview values={values} tags={tags} />
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-[0.14em] text-white/50 font-mono">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}

function JobPreview({ values, tags }: { values: FormValues; tags: string[] }) {
  const showSalary =
    Number.isFinite(values.salary_min) && Number.isFinite(values.salary_max);
  return (
    <motion.div
      layout
      className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 md:p-8 overflow-hidden"
    >
      <div className="relative">
        <div className="flex items-center gap-2 text-xs text-white/40 font-mono">
          <Building2 className="h-3.5 w-3.5" />
          {values.company_name || "Your Company"}
          <span className="text-white/20">·</span>
          <MapPin className="h-3.5 w-3.5" />
          {values.location || "—"}
          {values.remote && (
            <>
              <span className="text-white/20">·</span>
              <span className="text-primary">Remote</span>
            </>
          )}
        </div>
        <h2 className="mt-3 text-2xl md:text-3xl font-semibold tracking-[-0.03em]">
          {values.title || "Untitled role"}
        </h2>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline" className="border-white/10 text-white/70 capitalize">
            {values.seniority}
          </Badge>
          <Badge variant="outline" className="border-white/10 text-white/70">
            {values.employment_type.replace("_", " ")}
          </Badge>
        </div>

        {showSalary && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm font-mono">
            <DollarSign className="h-3.5 w-3.5 text-emerald-300" />
            {Number(values.salary_min).toLocaleString()}
            <span className="text-white/30">–</span>
            {Number(values.salary_max).toLocaleString()}
            <span className="text-white/40">{values.currency}</span>
          </div>
        )}

        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            <Tag className="h-3.5 w-3.5 text-white/40" />
            {tags.map((t) => (
              <span key={t} className="text-[11px] font-mono text-white/60 rounded-md border border-white/10 px-2 py-0.5">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-white/70 leading-relaxed border-t border-white/5 pt-6">
          {values.description_md || "Description will appear here…"}
        </div>

        {values.apply_url && (
          <a
            href={values.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary"
          >
            <ExternalLink className="h-3 w-3" /> External apply link
          </a>
        )}

        <div className="mt-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-amber-300/80 font-mono">
          <Zap className="h-3 w-3" />
          Preview · will be submitted as "pending"
        </div>
      </div>
    </motion.div>
  );
}
