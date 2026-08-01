import { GuestBanner } from "@/components/auth/GuestBanner";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { FileText, RotateCcw } from "lucide-react";

import { ShrinkNavbar } from "@/components/fx/ShrinkNavbar";
import { Dropzone } from "@/components/resume/Dropzone";
import { ProgressStepper, type StepStatus } from "@/components/resume/ProgressStepper";
import { AnalysisPanel } from "@/components/resume/AnalysisPanel";
import { KeywordChips } from "@/components/resume/KeywordChips";
import { GlassPanel } from "@/components/ui-ext/GlassPanel";
import { GradientText } from "@/components/ui-ext/GradientText";
import { Skeleton } from "@/components/ui-ext/Skeleton";
import { ErrorState } from "@/components/ui-ext/ErrorState";
import { EmptyState } from "@/components/ui-ext/EmptyState";
import { Button } from "@/components/ui/button";

import { supabase } from "@/integrations/supabase/client";
import { getResumeAnalysis, registerResume } from "@/lib/api/resumes";
import type { Resume } from "@/lib/api/types";
import { BackButton } from "@/components/layout/BackButton";

export const Route = createFileRoute("/dashboard_/resume")({
  head: () => ({
    meta: [
      { title: "Resume — jOBiON" },
      {
        name: "description",
        content: "Upload, parse, and analyze your resume with AI-powered ATS scoring.",
      },
    ],
  }),
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen grid place-items-center p-6">
      <ErrorState error={error as Error} onRetry={reset} />
    </div>
  ),
  component: ResumePage,
});

type Phase = "idle" | "uploading" | "parsing" | "analyzing" | "ready" | "error";

const ease = [0.16, 1, 0.3, 1] as const;

function ResumePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [phase, setPhase] = useState<Phase>("idle");
  const [uploadPct, setUploadPct] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);

  const analysisQuery = useQuery({
    queryKey: ["resume-analysis", resume?.id],
    queryFn: () => getResumeAnalysis(resume!.id),
    enabled: !!resume && (phase === "analyzing" || phase === "ready"),
    staleTime: 60_000,
  });

  const upload = useMutation({
    mutationFn: async (f: File) => {
      setPhase("uploading");
      setUploadPct(5);
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw new Error("You need to be signed in.");
      const userId = userData.user.id;
      const path = `${userId}/${Date.now()}-${f.name.replace(/[^\w.\-]+/g, "_")}`;

      // Fake smooth progress (Supabase JS v2 doesn't stream upload progress).
      const tick = window.setInterval(() => {
        setUploadPct((p) => (p < 85 ? p + Math.random() * 7 : p));
      }, 180);
      try {
        const { error: upErr } = await supabase.storage
          .from("resumes")
          .upload(path, f, {
            cacheControl: "3600",
            upsert: false,
            contentType: f.type || undefined,
          });
        if (upErr) throw upErr;
      } finally {
        window.clearInterval(tick);
      }
      setUploadPct(100);

      setPhase("parsing");
      const registered = await registerResume({ filename: f.name, storage_path: path });
      setResume(registered);

      // Parsing/embedding runs in the background on the server; poll until
      // it flips off "pending" instead of blocking the upload request on it.
      setPhase("analyzing");
      let analysis = await getResumeAnalysis(registered.id);
      const maxAttempts = 40; // ~80s ceiling at 2s intervals
      for (let i = 0; i < maxAttempts && analysis.status === "pending"; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        analysis = await getResumeAnalysis(registered.id);
      }
      if (analysis.status === "pending") {
        throw new Error("Resume analysis is taking longer than expected. Please check back shortly.");
      }

      qc.setQueryData(["resume-analysis", registered.id], analysis);
      setSelected(analysis.extracted_skills.slice(0, 6));
      setPhase("ready");
      return registered;
    },
    onError: (err) => {
      setPhase("error");
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    },
    onSuccess: () => {
      toast.success("Resume analyzed", { description: "Confirm keywords to search jobs." });
    },
  });

  const steps = useMemo(
    () => {
      const state = (target: Phase): StepStatus => {
        const order: Phase[] = ["uploading", "parsing", "analyzing", "ready"];
        const idxTarget = order.indexOf(target);
        const idxPhase = order.indexOf(phase);
        if (phase === "error" && idxPhase < idxTarget) return "idle";
        if (phase === "error" && idxPhase === idxTarget) return "error";
        if (idxPhase > idxTarget) return "done";
        if (idxPhase === idxTarget) return target === "ready" ? "done" : "active";
        return "idle";
      };
      return [
        {
          key: "upload",
          label: "Upload",
          hint: file ? `${(file.size / 1024).toFixed(0)} KB · ${file.name}` : "Send file to storage",
          status: state("uploading"),
        },
        { key: "parse", label: "Parse", hint: "Extract text & structure", status: state("parsing") },
        {
          key: "analyze",
          label: "Analyze",
          hint: "AI reviews strengths & gaps",
          status: state("analyzing"),
        },
        {
          key: "score",
          label: "Score",
          hint: "Confirm keywords → ATS scan",
          status: state("ready"),
        },
      ];
    },
    [phase, file],
  );

  const allKeywords = useMemo(() => {
    const set = new Set<string>();
    (analysisQuery.data?.extracted_skills ?? []).forEach((k) => set.add(k));
    customKeywords.forEach((k) => set.add(k));
    return Array.from(set);
  }, [analysisQuery.data, customKeywords]);

  const reset = () => {
    setPhase("idle");
    setFile(null);
    setResume(null);
    setUploadPct(0);
    setSelected([]);
    setCustomKeywords([]);
    upload.reset();
  };

  const running = phase !== "idle" && phase !== "ready" && phase !== "error";

  return (
    <div className="min-h-screen bg-transparent text-foreground antialiased">
      <ShrinkNavbar />

      <main className="mx-auto max-w-6xl px-4 pt-28 pb-24 md:px-6">
        <GuestBanner />
        <BackButton fallback="/dashboard" className="mb-6" />
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mb-10"
        >
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/[0.03] px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <FileText className="size-3" /> resume · pipeline
          </p>
          <h1 className="text-3xl font-medium tracking-[-0.03em] text-foreground md:text-4xl">
            Upload your <GradientText>resume</GradientText>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            We&apos;ll parse the file, extract skills, and prep an ATS-friendly search based on
            what you actually want to be hired for.
          </p>
        </motion.header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <section className="lg:col-span-3 space-y-6">
            <GlassPanel className="p-6">
              <AnimatePresence mode="wait" initial={false}>
                {phase === "idle" || phase === "error" ? (
                  <motion.div
                    key="drop"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35, ease }}
                  >
                    <Dropzone
                      disabled={running}
                      onFile={(f) => {
                        setFile(f);
                        upload.mutate(f);
                      }}
                    />
                    {phase === "error" && (
                      <div className="mt-4">
                        <Button variant="outline" size="sm" onClick={reset} className="gap-2">
                          <RotateCcw className="size-3.5" /> Try again
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="progress"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35, ease }}
                    className="space-y-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-lg border border-foreground/10 bg-foreground/[0.03]">
                          <FileText className="size-4 text-foreground/80" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm text-foreground">{file?.name}</p>
                          <p className="text-[11px] text-muted-foreground/80 font-mono">
                            {file ? `${(file.size / 1024).toFixed(0)} KB` : ""}
                          </p>
                        </div>
                      </div>
                      {phase === "ready" && (
                        <Button variant="ghost" size="sm" onClick={reset} className="gap-2 text-muted-foreground">
                          <RotateCcw className="size-3.5" /> Replace
                        </Button>
                      )}
                    </div>

                    {phase === "uploading" && (
                      <div>
                        <div className="mb-1 flex items-center justify-between text-[11px] font-mono text-muted-foreground/80">
                          <span>uploading…</span>
                          <span>{Math.round(uploadPct)}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.05]">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-primary via-primary/70 to-primary"
                            animate={{ width: `${uploadPct}%` }}
                            transition={{ duration: 0.25, ease }}
                          />
                        </div>
                      </div>
                    )}

                    <ProgressStepper steps={steps} />
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassPanel>

            {(phase === "ready" || phase === "analyzing") && (
              <Suspense fallback={<AnalysisSkeleton />}>
                {analysisQuery.isLoading && <AnalysisSkeleton />}
                {analysisQuery.isError && (
                  <ErrorState
                    error={analysisQuery.error as Error}
                    onRetry={() => analysisQuery.refetch()}
                  />
                )}
                {analysisQuery.data && <AnalysisPanel analysis={analysisQuery.data} />}
              </Suspense>
            )}
          </section>

          <aside className="lg:col-span-2">
            <GlassPanel className="sticky top-24 p-6">
              {phase !== "ready" || !analysisQuery.data ? (
                <EmptyState
                  title="No keywords yet"
                  description="Upload a resume to extract skills you can search jobs against."
                />
              ) : (
                <KeywordChips
                  keywords={allKeywords}
                  selected={selected}
                  onToggle={(kw) =>
                    setSelected((prev) =>
                      prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw],
                    )
                  }
                  onAdd={(kw) => {
                    setCustomKeywords((prev) => (prev.includes(kw) ? prev : [...prev, kw]));
                    setSelected((prev) => (prev.includes(kw) ? prev : [...prev, kw]));
                  }}
                  onSearch={() =>
                    navigate({
                      to: "/jobs",
                      search: { q: selected.join(" "), tags: selected } as never,
                    })
                  }
                />
              )}
            </GlassPanel>
          </aside>
        </div>
      </main>
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <GlassPanel className="p-6 space-y-5">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-16 w-full" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
