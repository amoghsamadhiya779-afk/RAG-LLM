"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  alpha: number;
  fadeSpeed: number;
  glow: boolean;
}

export const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { baseTheme: theme } = useTheme();
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, actualX: -9999, actualY: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];
    const maxParticles = 65;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Track mouse for parallax drift & direct repulsion coordinates
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX - window.innerWidth / 2) * 0.05;
      mouseRef.current.targetY = (e.clientY - window.innerHeight / 2) * 0.05;
      mouseRef.current.actualX = e.clientX;
      mouseRef.current.actualY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Initialize particles
    const initParticles = () => {
      particles = [];
      const count = window.innerWidth < 768 ? 25 : maxParticles;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5 + 0.5,
          speedX: (Math.random() - 0.5) * 0.08,
          speedY: (Math.random() - 0.5) * 0.08 - 0.04, // Drifts slightly upwards
          alpha: Math.random() * 0.5 + 0.1,
          fadeSpeed: Math.random() * 0.005 + 0.002,
          glow: Math.random() > 0.8,
        });
      }
    };
    initParticles();

    // Render loop
    const render = () => {
      // Clear canvas with subtle transparency for trails (soft movement)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Smooth mouse interpolation (lerp)
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Draw and update particles
      particles.forEach((p) => {
        // Apply parallax offset based on mouse position
        const drawX = p.x + mouseRef.current.x;
        const drawY = p.y + mouseRef.current.y;

        // Render particle
        ctx.beginPath();
        ctx.arc(drawX, drawY, p.size, 0, Math.PI * 2);

        // Adjust coloring based on active theme
        const isDark = theme === "dark";
        const color = isDark
          ? `rgba(226, 232, 240, ${p.alpha})` // Light Slate in dark mode
          : `rgba(15, 23, 42, ${p.alpha * 0.7})`; // Dark Slate in light mode

        ctx.fillStyle = color;

        if (p.glow && isDark) {
          ctx.shadowBlur = p.size * 5;
          ctx.shadowColor = "rgba(96, 165, 250, 0.4)"; // Soft blue glow
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fill();

        // Localized Antigravity Repulsion Force
        const dx = drawX - mouseRef.current.actualX;
        const dy = drawY - mouseRef.current.actualY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const forceRadius = 135;

        if (dist < forceRadius && dist > 1) {
          const force = (forceRadius - dist) / forceRadius;
          p.x += (dx / dist) * force * 1.6;
          p.y += (dy / dist) * force * 1.6;
        }

        // Update positions (drifting)
        p.x += p.speedX;
        p.y += p.speedY;

        // Shimmer / twinkle effect
        p.alpha += p.fadeSpeed;
        if (p.alpha > 0.75 || p.alpha < 0.1) {
          p.fadeSpeed = -p.fadeSpeed;
        }

        // Warp bounds checking
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-500"
      style={{ opacity: 0.6 }}
    />
  );
};
