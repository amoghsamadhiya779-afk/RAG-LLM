import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { listResumes } from "@/lib/api/resumes";
import { scoreResume } from "@/lib/api/ats";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui-ext/GradientButton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, CheckCircle2 } from "lucide-react";
import DotFieldBackground from "@/components/backgrounds/DotFieldBackground";

export const Route = createFileRoute("/dashboard_/ats/")({
  staticData: { transition: "fadeRise" },
  head: () => ({
    meta: [
      { title: "ATS Score - jOBiON" },
      {
        name: "description",
        content: "Upload a resume and see how ATS bots score you for any role.",
      },
    ],
  }),
  component: AtsIndex,
});

function AtsIndex() {
  const navigate = useNavigate();
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [jdText, setJdText] = useState("");

  const resumesQuery = useQuery({
    queryKey: ["resumes", "mine"],
    queryFn: () => listResumes(),
  });

  const scoreMutation = useMutation({
    mutationFn: async () => {
      if (!selectedResumeId || !jdText) throw new Error("Missing inputs");
      return scoreResume({ resume_id: selectedResumeId, jd_text: jdText });
    },
    onSuccess: (data) => {
      navigate({ to: "/dashboard/ats/$id", params: { id: data.id } });
    },
  });

  const isFormValid = selectedResumeId.length > 0 && jdText.trim().length > 10;

  return (
    <div className="min-h-screen bg-transparent text-foreground relative">
      <DotFieldBackground />
      <main className="mx-auto max-w-4xl px-4 py-24 sm:px-6 sm:py-32 relative z-10">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            ATS scoring
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            Beat the <span className="text-primary">bots.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground sm:text-xl sm:leading-relaxed">
            Select a resume, paste a Job Description, and we'll score it against real ATS rules -
            keyword coverage, missing skills, and actionable fixes.
          </p>
        </div>

        <div className="mt-16 mx-auto max-w-2xl">
          <div className="rounded-3xl border border-border/50 bg-background/50 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl">
            <div className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Select Resume</label>
                {resumesQuery.isLoading ? (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading your resumes...</span>
                  </div>
                ) : resumesQuery.isError ? (
                  <p className="text-sm text-destructive">Failed to load resumes.</p>
                ) : (
                  <Select
                    value={selectedResumeId}
                    onValueChange={setSelectedResumeId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an uploaded resume" />
                    </SelectTrigger>
                    <SelectContent>
                      {resumesQuery.data?.items && resumesQuery.data.items.length > 0 ? (
                        resumesQuery.data.items.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            <div className="flex items-center">
                              <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                              {r.filename}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No resumes found. Please upload one first.
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
                {resumesQuery.data?.items?.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    You don't have any resumes. Go to the Dashboard to upload one.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Job Description</label>
                <Textarea 
                  placeholder="Paste the target job description here..."
                  className="min-h-[200px] resize-y bg-background/50"
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                />
              </div>

              <div className="pt-4">
                <GradientButton 
                  className="w-full rounded-xl py-6 text-lg"
                  disabled={!isFormValid || scoreMutation.isPending}
                  onClick={() => scoreMutation.mutate()}
                >
                  {scoreMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing Against ATS Rules...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Run ATS Scan
                    </>
                  )}
                </GradientButton>
                {scoreMutation.isError && (
                  <p className="mt-2 text-sm text-destructive text-center">
                    Failed to generate ATS score. Please try again.
                  </p>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
