"use client";

import React from "react";
import { useTheme } from "@/components/ThemeProvider";

export const Logo = ({ className = "w-6 h-6" }: { className?: string }) => {
  const { baseTheme } = useTheme();
  const isDark = baseTheme === "dark";

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} transition-transform duration-300 hover:rotate-6`}
    >
      <defs>
        {/* Glow Gradients */}
        <linearGradient id="logo-grad-dark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" /> {/* Indigo 400 */}
          <stop offset="100%" stopColor="#6366f1" /> {/* Indigo 500 */}
        </linearGradient>
        
        <linearGradient id="logo-grad-light" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" /> {/* Indigo 600 */}
          <stop offset="100%" stopColor="#3730a3" /> {/* Indigo 800 */}
        </linearGradient>

        <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background Outer Ring (Retriever Wave) */}
      <circle
        cx="16"
        cy="16"
        r="14"
        stroke={isDark ? "url(#logo-grad-dark)" : "url(#logo-grad-light)"}
        strokeWidth="1.5"
        strokeDasharray="4 4"
        className="origin-center animate-[spin_40s_linear_infinite]"
      />

      {/* Main Document Layout Shape */}
      <path
        d="M10 8C10 6.89543 10.8954 6 12 6H18.5L22 9.5V24C22 25.1046 21.1046 26 20 26H12C10.8954 26 10 25.1046 10 24V8Z"
        fill={isDark ? "rgba(129, 140, 248, 0.08)" : "rgba(79, 70, 229, 0.05)"}
        stroke={isDark ? "url(#logo-grad-dark)" : "url(#logo-grad-light)"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Folded Document Corner */}
      <path
        d="M18 6V10H22"
        stroke={isDark ? "url(#logo-grad-dark)" : "url(#logo-grad-light)"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Retrieval Augmented Network Nodes */}
      <circle
        cx="14"
        cy="12"
        r="1.5"
        fill={isDark ? "#818cf8" : "#4f46e5"}
        filter={isDark ? "url(#logo-glow)" : ""}
      />
      <circle
        cx="18"
        cy="16"
        r="1.5"
        fill={isDark ? "#818cf8" : "#4f46e5"}
        filter={isDark ? "url(#logo-glow)" : ""}
      />
      <circle
        cx="13"
        cy="20"
        r="1.5"
        fill={isDark ? "#818cf8" : "#4f46e5"}
        filter={isDark ? "url(#logo-glow)" : ""}
      />

      {/* Connection Links */}
      <line
        x1="14"
        y1="12"
        x2="18"
        y2="16"
        stroke={isDark ? "rgba(129, 140, 248, 0.4)" : "rgba(79, 70, 229, 0.4)"}
        strokeWidth="1"
      />
      <line
        x1="18"
        y1="16"
        x2="13"
        y2="20"
        stroke={isDark ? "rgba(129, 140, 248, 0.4)" : "rgba(79, 70, 229, 0.4)"}
        strokeWidth="1"
      />
    </svg>
  );
};
