import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepStatus = "idle" | "active" | "done" | "error";
export interface StepDef {
  key: string;
  label: string;
  hint?: string;
  status: StepStatus;
}

export function ProgressStepper({ steps }: { steps: StepDef[] }) {
  return (
    <ol className="grid grid-cols-1 gap-3 md:grid-cols-4">
      {steps.map((s, i) => {
        const active = s.status === "active";
        const done = s.status === "done";
        const err = s.status === "error";
        return (
          <li key={s.key} className="relative">
            <motion.div
              initial={false}
              animate={{
                borderColor: err
                  ? "rgba(248,113,113,0.5)"
                  : active
                  ? "rgba(217,70,239,0.5)"
                  : done
                  ? "rgba(99,102,241,0.4)"
                  : "rgba(255,255,255,0.06)",
              }}
              className="flex items-center gap-3 rounded-xl border bg-white/[0.02] p-3"
            >
              <div
                className={cn(
                  "grid size-8 place-items-center rounded-lg border font-mono text-xs",
                  err
                    ? "border-red-400/40 bg-red-500/10 text-red-300"
                    : done
                    ? "border-primary/40 bg-primary/20 text-primary"
                    : active
                    ? "border-primary/40 bg-primary/20 text-primary"
                    : "border-white/10 bg-white/5 text-zinc-500",
                )}
              >
                {done ? (
                  <Check className="size-4" />
                ) : active ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm text-zinc-100">{s.label}</p>
                {s.hint && (
                  <p className="truncate text-[11px] text-zinc-500 font-mono">{s.hint}</p>
                )}
              </div>
            </motion.div>
          </li>
        );
      })}
    </ol>
  );
}
