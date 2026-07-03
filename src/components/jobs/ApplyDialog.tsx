import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GradientButton } from "@/components/ui-ext";
import { createApplication } from "@/lib/api/applications";
import type { Job } from "@/lib/api/types";

interface ApplyDialogProps {
  job: Job;
}

// Dynamic-import canvas-confetti so the ~15 KB payload only downloads on the
// first successful apply — never on initial page load.
async function fireConfetti() {
  const { default: confetti } = await import("canvas-confetti");
  const end = Date.now() + 600;
  const colors = ["#2E6FFF", "#2E6FFF", "#6AA2FF"];
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export function ApplyDialog({ job }: ApplyDialogProps) {
  const [open, setOpen] = useState(false);
  const [cover, setCover] = useState("");
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      createApplication({ job_id: job.id, resume_id: "res_1", cover_letter: cover || undefined }),
    onMutate: async () => {
      // optimistic UX: close + confetti + toast; refetch applications after
      setOpen(false);
      void fireConfetti();
      toast.success(`Application sent to ${job.company.name}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      setCover("");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to submit application");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <GradientButton className="w-full px-6 py-3 text-base sm:w-auto">
          Apply now
        </GradientButton>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply to {job.title}</DialogTitle>
          <DialogDescription>
            Submitting to <span className="text-foreground">{job.company.name}</span>. Your default resume will be attached.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cover">Cover note (optional)</Label>
          <Textarea
            id="cover"
            rows={6}
            value={cover}
            onChange={(e) => setCover(e.target.value)}
            placeholder="Say hi — a couple of sentences on why you're a fit."
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <GradientButton onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Sending…" : "Submit application"}
          </GradientButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
