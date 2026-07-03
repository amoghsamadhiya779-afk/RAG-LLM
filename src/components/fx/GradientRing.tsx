import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Animated conic-gradient ring wrapper for featured jobs.
 * The rotating ring lives on a ::before pseudo via a CSS keyframe (see styles.css).
 */
export function GradientRing({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("gradient-ring relative rounded-[18px] p-[1.5px]", className)}>
      {children}
    </div>
  );
}
