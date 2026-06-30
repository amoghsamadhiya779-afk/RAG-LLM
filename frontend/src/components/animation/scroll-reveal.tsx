"use client";

import { FadeIn } from "./fade-in";
import { ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  className?: string;
}

export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  className,
}: ScrollRevealProps) {
  return (
    <FadeIn direction={direction} delay={delay} duration={0.8} className={className}>
      {children}
    </FadeIn>
  );
}
