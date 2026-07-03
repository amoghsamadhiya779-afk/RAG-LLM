import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function GlassPanel({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border backdrop-blur-xl",
        "bg-[var(--glass)] border-[var(--glass-border)]",
        "shadow-[var(--shadow-soft)]",
        className,
      )}
      {...props}
    />
  );
}
