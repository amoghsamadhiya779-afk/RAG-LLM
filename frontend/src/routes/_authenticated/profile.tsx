import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { JobCard } from "@/components/site/job-card";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Your profile — jOBiON" }] }),
  component: Profile,
});

function Profile() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);

  const { data: resumes = [] } = useQuery({
    queryKey: ["resumes", session?.user.id],
    queryFn: () => api.resumes.mine(),
    enabled: !!session,
  });
  const latestResume = resumes[0] ?? null;

  const { data: saved = [] } = useQuery({
    queryKey: ["saved", session?.user.id],
    queryFn: () => api.saved.list(),
    enabled: !!session,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["applications", "mine", session?.user.id],
    queryFn: () => api.applications.mine(),
    enabled: !!session,
  });

  const { data: recommended = [] } = useQuery({
    queryKey: ["jobs", "recommended", latestResume?.id],
    queryFn: () => latestResume ? api.jobs.recommended(latestResume.id) : Promise.resolve([]),
    enabled: !!latestResume,
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!file || !session) throw new Error("Pick a file");
      const r = await api.resumes.upload(file);
      await api.resumes.parse(r.id);
      return r;
    },
    onSuccess: () => { toast.success("Resume parsed"); setFile(null); qc.invalidateQueries({ queryKey: ["resumes"] }); qc.invalidateQueries({ queryKey: ["jobs", "recommended"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-dvh flex flex-col">
      <SiteHeader />
      <main className="flex-1 container-page py-10">
        <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-h2 font-display">{session?.profile.fullName ?? "Your profile"}</h1>
            <p className="mt-1 text-small text-secondary">{session?.profile.headline ?? session?.user.email}</p>
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-4">
            <div className="glass-card p-5">
              <h2 className="text-small font-ui">Resume</h2>
              {latestResume ? (
                <div className="mt-3">
                  <div className="flex items-center gap-2 text-small">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="truncate">{latestResume.fileName}</span>
                  </div>
                  {latestResume.parsed && (
                    <div className="mt-4">
                      <div className="text-micro font-ui text-secondary">Parsed skills</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {latestResume.parsed.skills.map((s) => (
                          <span key={s} className="rounded-md bg-secondary px-2 py-0.5 text-[11px]">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-micro text-secondary">No resume yet. Upload one to get AI matches.</p>
              )}
              <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border p-4 text-center transition-colors hover:border-primary/50">
                <input type="file" accept=".pdf,.doc,.docx,.txt" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                <UploadCloud className="h-5 w-5 text-secondary" />
                <span className="text-micro text-secondary">{file ? file.name : "Drop PDF / DOCX / TXT"}</span>
              </label>
              <Button size="sm" className="mt-2 w-full" onClick={() => upload.mutate()} disabled={!file || upload.isPending}>
                {upload.isPending ? "Parsing…" : latestResume ? "Replace resume" : "Upload"}
              </Button>
            </div>
          </aside>

          <section>
            <Tabs defaultValue="recommended">
              <TabsList>
                <TabsTrigger value="recommended"><Sparkles className="mr-1 h-3.5 w-3.5" />Recommended</TabsTrigger>
                <TabsTrigger value="saved">Saved ({saved.length})</TabsTrigger>
                <TabsTrigger value="applications">Applications ({applications.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="recommended" className="mt-4">
                {recommended.length === 0 ? (
                  <Empty title="No matches yet" body="Upload your resume to get AI-matched roles." />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {recommended.map((j) => <JobCard key={j.id} job={j} />)}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="saved" className="mt-4">
                {saved.length === 0 ? (
                  <Empty title="Nothing saved" body={<>Bookmark roles you like from the <Link to="/jobs" className="underline">browse page</Link>.</>} />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {saved.map((j) => <JobCard key={j.id} job={j} />)}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="applications" className="mt-4">
                {applications.length === 0 ? (
                  <Empty title="No applications yet" body="Apply to a role and track replies here." />
                ) : (
                  <ul className="space-y-2">
                    {applications.map((a) => (
                      <motion.li key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="glass-card flex items-center justify-between p-4">
                        <div>
                          <div className="font-ui">{a.job?.title ?? "Job"}</div>
                          <div className="text-micro text-secondary">{a.job?.company?.name ?? "—"} · {formatDate(a.createdAt)}</div>
                        </div>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-micro capitalize">{a.stage}</span>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Empty({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div className="glass-card p-10 text-center">
      <h3 className="font-ui">{title}</h3>
      <p className="mt-1 text-small text-secondary">{body}</p>
    </div>
  );
}
