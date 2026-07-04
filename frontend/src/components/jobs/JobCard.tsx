import { memo, useRef, useState, type PointerEvent, type MouseEvent } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Heart, MapPin, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import type { Job } from "@/lib/api/types";
import { saveJob, unsaveJob } from "@/lib/api/jobs";
import { PulseDot, GradientRing } from "@/components/fx";

interface JobCardProps {
  job: Job;
  initialSaved?: boolean;
}

function isFresh(iso: string): boolean {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < 48 * 60 * 60 * 1000;
}

function formatSalary(job: Job) {
  if (!job.salary_min) return null;
  const min = (job.salary_min / 1000).toFixed(0);
  const max = job.salary_max ? (job.salary_max / 1000).toFixed(0) : min;
  return `$${min}k–$${max}k`;
}

function JobCardImpl({ job, initialSaved = false }: JobCardProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [burst, setBurst] = useState(0);
  const [busy, setBusy] = useState(false);

  const fresh = isFresh(job.created_at);
  const featured = job.is_featured;
  const salary = formatSalary(job);

  async function toggleSave(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const next = !saved;
    setSaved(next);
    if (next) setBurst((b) => b + 1);
    try {
      if (next) await saveJob(job.id);
      else await unsaveJob(job.id);
    } catch (err) {
      setSaved(!next);
      toast.error(err instanceof Error ? err.message : "Couldn't update saved jobs");
    } finally {
      setBusy(false);
    }
  }

  const inner = (
    <CollapsedTile
      job={job}
      fresh={fresh}
      salary={salary}
      saved={saved}
      burst={burst}
      onToggleSave={toggleSave}
    />
  );

  return featured ? <GradientRing className="h-full">{inner}</GradientRing> : inner;
}

import { ApplyDialog } from "@/components/jobs/ApplyDialog";
import { GradientButton } from "@/components/ui-ext";

/** Collapsed grid tile with 3D tilt + dynamic cursor-tracking border. */
function CollapsedTile({
  job,
  fresh,
  salary,
  saved,
  burst,
  onToggleSave,
}: {
  job: Job;
  fresh: boolean;
  salary: string | null;
  saved: boolean;
  burst: number;
  onToggleSave: (e: MouseEvent) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  // pointer position in px for the border spotlight
  const px = useMotionValue(-200);
  const py = useMotionValue(-200);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 20 });

  function onMove(e: PointerEvent<HTMLDivElement>) {
    // Fine-pointer only: skip 3D tilt on touch — no hover state, and juddery
    // to boot. Also skip cursor-tracking gradient border for the same reason.
    if (e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
    px.set(e.clientX - rect.left);
    py.set(e.clientY - rect.top);
  }
  function onLeave() {
    mx.set(0);
    my.set(0);
    px.set(-200);
    py.set(-200);
  }


  const borderMask = useTransform(
    [px, py] as never,
    ([x, y]: number[]) =>
      `radial-gradient(180px circle at ${x}px ${y}px, #000 0%, transparent 70%)`,
  );

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 800 }}
      className="group relative h-full"
    >
      <div className="relative block h-full overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur transition-colors">
        {/* Dynamic gradient border that follows the cursor */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            padding: 1,
            background: "var(--gradient-brand)",
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            WebkitMaskImage: borderMask as unknown as string,
            maskImage: borderMask as unknown as string,
          }}
        />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
                style={{ background: "var(--gradient-brand)" }}
              >
                {typeof job.company === "string" ? job.company[0] : job.company?.name?.[0] || "?"}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">
                    {typeof job.company === "string" ? job.company : job.company?.name || "Unknown"}
                  </p>
                  {fresh && <PulseDot />}
                </div>
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {job.remote ? "Remote" : job.location}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleSave}
              aria-pressed={saved}
              aria-label={saved ? "Unsave job" : "Save job"}
              className="relative -m-2 rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Heart
                className={`h-4 w-4 transition-all ${
                  saved ? "scale-110 fill-pink-500 text-primary" : ""
                }`}
              />
              <AnimatePresence>
                {burst > 0 && (
                  <motion.span
                    key={burst}
                    initial={{ scale: 0, opacity: 0.9 }}
                    animate={{ scale: 2.4, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    className="pointer-events-none absolute inset-0 m-auto h-4 w-4 rounded-full"
                    style={{ background: "var(--gradient-brand)" }}
                  />
                )}
              </AnimatePresence>
            </button>
          </div>

          <h3 className="mt-5 flex items-start justify-between gap-3 text-lg leading-snug">
            {job.source === "serper_web" ? (
              <a href={job.apply_url || "#"} target="_blank" rel="noopener noreferrer" className="line-clamp-2 hover:underline decoration-primary/50">
                {job.title}
              </a>
            ) : (
              <Link to="/jobs/$id" params={{ id: job.id }} className="line-clamp-2 hover:underline decoration-primary/50">
                {job.title}
              </Link>
            )}
            {job.source === "serper_web" ? (
              <a href={job.apply_url || "#"} target="_blank" rel="noopener noreferrer" className="focus:outline-none">
                <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            ) : (
              <Link to="/jobs/$id" params={{ id: job.id }} className="focus:outline-none">
                <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            )}
          </h3>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {job.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded-md border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex flex-col gap-1">
              <span className="capitalize">
                {job.seniority || job.level || "Any level"} · {(job.employment_type || job.job_type || "").replace("_", " ")}
              </span>
              {salary ? <span>{salary}</span> : null}
            </div>
            
            <div onClick={(e) => e.stopPropagation()}>
              {job.source === 'internal' || !job.apply_url ? (
                <ApplyDialog job={job} size="sm" />
              ) : (
                <a 
                  href={job.apply_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                >
                  Apply external
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Memoized: JobCard rerenders were the hot path when filters or infinite pages
// changed. Props are shallow-stable (job object reused from cache).
export const JobCard = memo(JobCardImpl);
