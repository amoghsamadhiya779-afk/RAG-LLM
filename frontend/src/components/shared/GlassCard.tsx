"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: "glass" | "glass-lg" | "clay" | "hybrid";
  interactive?: boolean;
  delay?: number;
}

export function GlassCard({
  children,
  className,
  variant = "glass",
  interactive = false,
  delay = 0,
}: GlassCardProps) {
  const variants = {
    "glass": "glass-card",
    "glass-lg": "glass-card-lg",
    "clay": "clay-card",
    "hybrid": "hybrid-card",
  };

  return (
    <motion.div
      className={cn(
        "transition-all duration-300",
        variants[variant],
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={interactive ? { y: -5, scale: 1.01 } : {}}
      transition={{
        duration: 0.5,
        delay,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}
