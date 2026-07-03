import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Search, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Props {
  keywords: string[];
  selected: string[];
  onToggle: (kw: string) => void;
  onAdd: (kw: string) => void;
  onSearch: () => void;
}

export function KeywordChips({ keywords, selected, onToggle, onAdd, onSearch }: Props) {
  const [draft, setDraft] = useState("");
  const submit = () => {
    const v = draft.trim();
    if (!v) return;
    onAdd(v);
    setDraft("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-zinc-100">Confirm your skills</h3>
          <p className="text-xs text-zinc-500 font-mono">
            Tap keywords you want to search jobs for.
          </p>
        </div>
        <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[11px] text-zinc-400">
          {selected.length}/{keywords.length} selected
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <AnimatePresence initial={false}>
          {keywords.map((kw) => {
            const active = selected.includes(kw);
            return (
              <motion.button
                key={kw}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => onToggle(kw)}
                className={cn(
                  "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-mono transition-colors",
                  active
                    ? "border-primary/40 bg-gradient-to-r from-primary via-primary/70 to-primary text-white"
                    : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:text-white",
                )}
              >
                {active ? <Check className="size-3" /> : <Plus className="size-3 opacity-60" />}
                {kw}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center rounded-lg border border-white/10 bg-white/[0.03] px-3">
          <Plus className="size-3.5 text-zinc-500" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Add a custom keyword…"
            className="w-full bg-transparent px-2 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 font-mono"
          />
          {draft && (
            <button
              onClick={() => setDraft("")}
              className="text-zinc-500 hover:text-zinc-300"
              aria-label="Clear"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <Button
          onClick={onSearch}
          disabled={selected.length === 0}
          className="gap-2 bg-gradient-to-r from-primary via-primary/70 to-primary text-white hover:opacity-90 disabled:opacity-40"
        >
          <Search className="size-4" />
          Search jobs
        </Button>
      </div>
    </div>
  );
}
