import { useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"> {
  children: ReactNode;
  variant?: "primary" | "ghost";
}

export function MagneticButton({ children, className, variant = "primary", ...rest }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 15, mass: 0.3 });
  const sy = useSpring(y, { stiffness: 200, damping: 15, mass: 0.3 });

  function onMove(e: React.MouseEvent<HTMLButtonElement>) {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - (rect.left + rect.width / 2);
    const my = e.clientY - (rect.top + rect.height / 2);
    x.set(mx * 0.25);
    y.set(my * 0.35);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy }}
      className={cn(
        "group relative inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-medium transition-shadow will-change-transform",
        variant === "primary"
          ? "text-white shadow-[0_10px_40px_-10px_rgba(139,92,246,0.7)] hover:shadow-[0_16px_60px_-10px_rgba(236,72,153,0.7)]"
          : "border border-border bg-background/40 backdrop-blur hover:bg-accent",
        className,
      )}
      {...rest}
    >
      {variant === "primary" && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-xl"
          style={{ background: "var(--gradient-brand)" }}
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </motion.button>
  );
}
