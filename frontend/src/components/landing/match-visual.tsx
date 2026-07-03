import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
import { jobs as jobsApi } from "@/services/api";
import type { JobWithCompany } from "@/types";

const QUERY = "senior react engineer, fully remote, ai/ml team";

export function MatchVisual() {
  const [items, setItems] = useState<JobWithCompany[]>([]);
  useEffect(() => {
    jobsApi.list({}, 1, 3).then((r) => setItems(r.items)).catch(() => setItems([]));
  }, []);

  const matches = [97, 92, 86];

  return (
    <div className="overflow-hidden rounded-md bg-muted">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 border-b border-border bg-card/40 px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="ml-3 font-mono text-[11px] text-secondary">jOBiON.dev/search</span>
      </div>

      {/* Search input */}
      <div className="p-4">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
          <Search className="h-4 w-4 text-secondary" />
          <motion.span
            initial={{ width: 0 }}
            whileInView={{ width: "auto" }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="overflow-hidden whitespace-nowrap text-small text-foreground"
          >
            {QUERY}
          </motion.span>
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="h-4 w-px bg-foreground"
          />
        </div>

        <div className="mt-3 flex items-center gap-2 text-micro text-secondary">
          <Sparkles className="h-3.5 w-3.5 text-foreground" />
          Ranked by semantic match to your resume
        </div>

        {/* Ranked job cards */}
        <ol className="mt-4 space-y-2">
          {(items.length ? items : Array.from({ length: 3 })).map((j, i) => {
            const job = j as JobWithCompany | undefined;
            return (
              <motion.li
                key={job?.id ?? i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 + i * 0.18, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3.5 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-small font-ui">
                    {job?.title ?? `Senior Engineer ${i + 1}`}
                  </div>
                  <div className="mt-0.5 truncate text-micro text-secondary">
                    {job?.company.name ?? "Company"} · {job?.remote ? "Remote" : job?.location ?? "Remote"}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-gradient-accent px-2.5 py-1 text-[11px] font-heading text-white">
                  {matches[i]}% match
                </span>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
