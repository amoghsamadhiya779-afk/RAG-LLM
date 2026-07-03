"use client";

import { useEffect, useRef, ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useLocation } from "@tanstack/react-router";

interface ParallaxProps {
  children: ReactNode;
  speed?: number; // 1 is normal scroll, 0 is fixed, <1 is slower, >1 is faster
  className?: string;
}

export function Parallax({ children, speed = 0.5, className }: ParallaxProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const pathname = useLocation().pathname;

  useEffect(() => {
    // Register GSAP plugins safely on client only
    gsap.registerPlugin(ScrollTrigger);

    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isDashboard = pathname?.startsWith("/dashboard");

    if (prefersReducedMotion || isDashboard || !triggerRef.current || !targetRef.current) return;

    // Calculate Y movement based on speed
    // e.g. if speed is 0.5, it moves half as fast as scroll (parallax effect)
    const yPercent = (1 - speed) * 100;

    const ctx = gsap.context(() => {
      gsap.to(targetRef.current, {
        yPercent,
        ease: "none",
        scrollTrigger: {
          trigger: triggerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }, triggerRef);

    return () => ctx.revert();
  }, [speed, pathname]);

  return (
    <div ref={triggerRef} className={`relative overflow-hidden ${className ?? ""}`}>
      <div ref={targetRef} className="h-[120%] w-full -top-[10%] relative">
        {children}
      </div>
    </div>
  );
}
