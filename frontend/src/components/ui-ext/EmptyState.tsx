import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { JobionMark } from "@/components/brand/JobionLogo";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-border/60 bg-card/40 p-10 text-center",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid place-items-center opacity-[0.18]"
      >
        <JobionMark className="h-24 w-24 rounded-3xl border-0 bg-transparent shadow-none backdrop-blur-0" />
      </div>
      <div className="relative">
        {icon ? <div className="mb-4 text-muted-foreground">{icon}</div> : null}
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        {description ? (
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}
