import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { UploadCloud, FileText, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const schema = z.object({
  coverNote: z.string().trim().max(2000, "Max 2000 characters").optional(),
});

export function ApplyDialog({ open, onOpenChange, jobId, jobTitle }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  jobId: string;
  jobTitle: string;
}) {
  const { session } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [coverNote, setCoverNote] = useState("");
  const [done, setDone] = useState(false);

  const apply = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error("Sign in to apply");
      const parsed = schema.parse({ coverNote: coverNote || undefined });
      let resumeId: string | undefined;
      if (file) {
        const r = await api.resumes.upload(file);
        resumeId = r.id;
      }
      return api.applications.create(jobId, { userId: session.user.id, coverNote: parsed.coverNote, resumeId });
    },
    onSuccess: () => {
      setDone(true);
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors: ["#7CE5B4", "#9B87F5", "#fff"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleClose = (v: boolean) => {
    onOpenChange(v);
    if (!v) { setTimeout(() => { setFile(null); setCoverNote(""); setDone(false); }, 200); }
  };

  if (!session) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in to apply</DialogTitle>
            <DialogDescription>Create a free account to apply to {jobTitle}.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
            <Button onClick={() => router.push("/auth")}>Sign in</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (done) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-primary" />
            <h3 className="mt-4 font-display text-xl font-semibold">Application sent</h3>
            <p className="mt-2 text-sm text-muted-foreground">We've notified {jobTitle.split(" at ")[0]}. Track replies in your profile.</p>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" onClick={() => handleClose(false)}>Close</Button>
              <Button onClick={() => router.push("/profile")}>View applications</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply to {jobTitle}</DialogTitle>
          <DialogDescription>Send your resume and a short note. Takes 30 seconds.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface/40 px-6 py-8 text-center transition-colors hover:border-primary/50"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setFile(f); }}
          >
            <input type="file" accept=".pdf,.doc,.docx,.txt" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {file ? (
              <>
                <FileText className="h-6 w-6 text-primary" />
                <div className="text-sm font-medium">{file.name}</div>
                <div className="text-xs text-muted-foreground">Click or drop to replace</div>
              </>
            ) : (
              <>
                <UploadCloud className="h-6 w-6 text-muted-foreground" />
                <div className="text-sm font-medium">Drop resume or click to upload</div>
                <div className="text-xs text-muted-foreground">PDF, DOCX, or TXT</div>
              </>
            )}
          </label>

          <div>
            <Label htmlFor="cover">Cover note (optional)</Label>
            <Textarea id="cover" value={coverNote} onChange={(e) => setCoverNote(e.target.value)} rows={4} placeholder="Why you'd love to work here…" maxLength={2000} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          <Button onClick={() => apply.mutate()} disabled={apply.isPending}>{apply.isPending ? "Sending…" : "Send application"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
