import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const GradientButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(function GradientButton({ className, children, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white",
        "[background-image:var(--gradient-brand)]",
        "shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--brand-mid)_60%,transparent)]",
        "transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-14px_color-mix(in_oklab,var(--brand-mid)_70%,transparent)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
