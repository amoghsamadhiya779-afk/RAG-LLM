import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, TriangleAlert, Lightbulb } from "lucide-react";
import type { ResumeAnalysis } from "@/lib/api/types";
import { GlassPanel } from "@/components/ui-ext/GlassPanel";

const ease = [0.16, 1, 0.3, 1] as const;

function Section({
  icon: Icon,
  title,
  items,
  tone,
}: {
  icon: typeof Sparkles;
  title: string;
  items: string[];
  tone: "brand" | "green" | "amber" | "blue";
}) {
  const toneMap = {
    brand: "text-primary",
    green: "text-emerald-300",
    amber: "text-amber-300",
    blue: "text-sky-300",
  } as const;
  return (
    <div>
      <div className={`mb-3 flex items-center gap-2 ${toneMap[tone]}`}>
        <Icon className="size-4" />
        <h3 className="text-sm font-medium tracking-tight text-zinc-100">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-zinc-500 font-mono">— none —</p>
      ) : (
        <ul className="space-y-2">
          {items.map((t, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.04, ease }}
              className="flex gap-2 text-sm text-zinc-300"
            >
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-zinc-600" />
              <span>{t}</span>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AnalysisPanel({ analysis }: { analysis: ResumeAnalysis }) {
  return (
    <GlassPanel className="p-6">
      <div className="mb-5">
        <div className="mb-1 flex items-center gap-2 text-xs text-zinc-500 font-mono uppercase tracking-widest">
          <Sparkles className="size-3.5" />
          AI Summary
        </div>
        <p className="text-base leading-relaxed text-zinc-100">{analysis.summary}</p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Section icon={ShieldCheck} title="Strengths" items={analysis.strengths} tone="green" />
        <Section icon={TriangleAlert} title="Gaps" items={analysis.gaps} tone="amber" />
        <Section icon={Lightbulb} title="Suggestions" items={analysis.suggestions} tone="blue" />
      </div>
    </GlassPanel>
  );
}
