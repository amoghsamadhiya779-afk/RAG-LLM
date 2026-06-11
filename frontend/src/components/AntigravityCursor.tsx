"use client";

import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useChat } from "@/context/ChatContext";

export const AntigravityCursor = () => {
  const { theme } = useChat();
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [magneticElement, setMagneticElement] = useState<DOMRect | null>(null);
  
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Inertia spring tracking config
  const springConfig = { damping: 30, stiffness: 320, mass: 0.45 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Hide standard system cursor on desktop
    const addCursorStyle = () => {
      const style = document.createElement("style");
      style.id = "custom-cursor-style";
      style.innerHTML = `
        @media (min-width: 768px) {
          body, button, a, [role="button"], textarea, input, select {
            cursor: none !important;
          }
        }
      `;
      document.head.appendChild(style);
    };

    addCursorStyle();
    setIsVisible(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (magneticElement) {
        // If magnetic snapping is active, snap the spring coordinates to the center of the button
        // but let it drag slightly with mouse delta to simulate stretch elasticity
        const elemCenterX = magneticElement.left + magneticElement.width / 2;
        const elemCenterY = magneticElement.top + magneticElement.height / 2;
        
        // Stretch delta (15% drag pull)
        const dx = e.clientX - elemCenterX;
        const dy = e.clientY - elemCenterY;
        
        mouseX.set(elemCenterX - 10 + dx * 0.15);
        mouseY.set(elemCenterY - 10 + dy * 0.15);
      } else {
        mouseX.set(e.clientX - 10);
        mouseY.set(e.clientY - 10);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const interactiveEl = target.closest(
        'button, a, [role="button"], input:not([type="hidden"]), textarea, select, [data-hover="true"]'
      );

      if (interactiveEl) {
        setIsHovered(true);
        // Snaps to the dimensions of the interactive element
        const rect = (interactiveEl as HTMLElement).getBoundingClientRect();
        setMagneticElement(rect);
      } else {
        setIsHovered(false);
        setMagneticElement(null);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      
      const styleEl = document.getElementById("custom-cursor-style");
      if (styleEl) styleEl.remove();
    };
  }, [magneticElement, mouseX, mouseY]);

  if (!isVisible) return null;

  const isDark = theme === "dark";

  // Calculate dynamic dimensions of the ring based on hovered elements
  const ringWidth = magneticElement ? magneticElement.width + 12 : isHovered ? 36 : 20;
  const ringHeight = magneticElement ? magneticElement.height + 12 : isHovered ? 36 : 20;
  
  // Offset alignment if magnetic snapped
  const ringOffsetX = magneticElement ? -(magneticElement.width / 2) + 4 : isHovered ? -8 : 0;
  const ringOffsetY = magneticElement ? -(magneticElement.height / 2) + 4 : isHovered ? -8 : 0;

  return (
    <>
      {/* Outer Magnetic Ring */}
      <motion.div
        style={{
          x: cursorX,
          y: cursorY,
        }}
        animate={{
          width: ringWidth,
          height: ringHeight,
          x: cursorX.get() + ringOffsetX,
          y: cursorY.get() + ringOffsetY,
          borderRadius: magneticElement ? "12px" : "9999px",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 26, mass: 0.4 }}
        className={`fixed top-0 left-0 pointer-events-none z-50 hidden md:block border transition-colors duration-200
          ${
            isHovered
              ? isDark
                ? "bg-dark-accent/10 border-dark-accent/80 shadow-[0_0_15px_rgba(129,140,248,0.3)]"
                : "bg-light-accent/5 border-light-accent/60 shadow-[0_0_12px_rgba(79,70,229,0.2)]"
              : isDark
              ? "bg-transparent border-slate-400/40"
              : "bg-transparent border-slate-900/35"
          }
        `}
      />
      
      {/* Liquid Inner Dot */}
      <motion.div
        style={{
          x: cursorX,
          y: cursorY,
        }}
        animate={{
          scale: isHovered && magneticElement ? 0 : 1, // Shrink to 0 if magnetic snapped to focus border
          x: cursorX.get() + 7,
          y: cursorY.get() + 7,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
        className={`fixed top-0 left-0 w-1.5 h-1.5 rounded-full pointer-events-none z-50 hidden md:block
          ${isDark ? "bg-dark-accent" : "bg-light-accent"}
        `}
      />
    </>
  );
};
