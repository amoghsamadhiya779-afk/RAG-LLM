"use client";

import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useChat } from "@/context/ChatContext";

export const AntigravityCursor = () => {
  const { theme } = useChat();
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Ultra-smooth inertia tracking config
  const springConfig = { damping: 32, stiffness: 350, mass: 0.5 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Hide default cursor on desktop
    const addCursorStyle = () => {
      const style = document.createElement("style");
      style.id = "custom-cursor-style";
      style.innerHTML = `
        @media (min-width: 768px) {
          body, button, a, [role="button"], textarea, input {
            cursor: none !important;
          }
        }
      `;
      document.head.appendChild(style);
    };

    addCursorStyle();
    setIsVisible(true);

    const handleMouseMove = (e: MouseEvent) => {
      // Offset by half of cursor base width (10px) to center it
      mouseX.set(e.clientX - 10);
      mouseY.set(e.clientY - 10);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    // Watch for hovered elements to expand cursor size
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Check if target or any of its ancestors are interactive
      const isInteractive = 
        target.tagName === "BUTTON" || 
        target.tagName === "A" || 
        target.tagName === "TEXTAREA" ||
        target.tagName === "INPUT" ||
        target.closest("button") || 
        target.closest("a") || 
        target.closest('[role="button"]') ||
        target.getAttribute("data-hover") === "true";

      setIsHovered(!!isInteractive);
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
  }, [mouseX, mouseY]);

  if (!isVisible) return null;

  const isDark = theme === "dark";

  return (
    <>
      {/* Outer Ring Cursor */}
      <motion.div
        style={{
          x: cursorX,
          y: cursorY,
        }}
        animate={{
          width: isHovered ? 48 : 20,
          height: isHovered ? 48 : 20,
          x: isHovered ? cursorX.get() - 14 : cursorX.get(),
          y: isHovered ? cursorY.get() - 14 : cursorY.get(),
        }}
        transition={{ type: "spring", stiffness: 450, damping: 30 }}
        className={`fixed top-0 left-0 rounded-full pointer-events-none z-50 hidden md:block border transition-colors duration-200
          ${
            isHovered
              ? isDark
                ? "bg-blue-600/15 border-blue-400/80 shadow-[0_0_15px_rgba(96,165,250,0.4)]"
                : "bg-indigo-600/10 border-indigo-600/60 shadow-[0_0_12px_rgba(79,70,229,0.25)]"
              : isDark
              ? "bg-transparent border-slate-400/60"
              : "bg-transparent border-slate-900/40"
          }
        `}
      />
      {/* Inner Dot Cursor */}
      <motion.div
        style={{
          x: cursorX,
          y: cursorY,
        }}
        animate={{
          scale: isHovered ? 0 : 1,
          x: cursorX.get() + 7,
          y: cursorY.get() + 7,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        className={`fixed top-0 left-0 w-1.5 h-1.5 rounded-full pointer-events-none z-50 hidden md:block
          ${isDark ? "bg-blue-400" : "bg-indigo-600"}
        `}
      />
    </>
  );
};
