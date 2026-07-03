import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function GradientText({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "bg-clip-text text-transparent",
        "[background-image:var(--gradient-brand)]",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
