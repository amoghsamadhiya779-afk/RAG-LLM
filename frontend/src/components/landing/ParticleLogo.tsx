import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  text?: string;
  scatterAtMs?: number;
  className?: string;
};

/**
 * Rasterizes the wordmark, samples target pixels, and animates a swirl-in →
 * hold → scatter sequence. Single RAF loop; cancelled on unmount.
 */
export function ParticleLogo({ text = "jOBiON", scatterAtMs = 1300, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = parent.getBoundingClientRect();
    const w = Math.max(rect.width, 320);
    const h = Math.max(rect.height, 120);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    // Rasterize wordmark
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const octx = off.getContext("2d")!;
    const fontSize = Math.min(w * 0.22, h * 0.72, 180);
    octx.fillStyle = "#fff";
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.font = `800 ${fontSize}px Inter, ui-sans-serif, system-ui`;
    octx.fillText(text, w / 2, h / 2);
    const img = octx.getImageData(0, 0, w, h).data;

    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    const cap = isMobile ? 800 : 1800;

    type P = { x: number; y: number; tx: number; ty: number; vx: number; vy: number; c: string; sx: number; sy: number };
    const targets: Array<{ x: number; y: number }> = [];
    const step = Math.max(3, Math.floor(fontSize / 32));
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        if (img[(y * w + x) * 4 + 3] > 128) targets.push({ x, y });
      }
    }
    // Downsample to cap
    if (targets.length > cap) {
      const stride = targets.length / cap;
      const kept: typeof targets = [];
      for (let i = 0; i < cap; i++) kept.push(targets[Math.floor(i * stride)]);
      targets.length = 0;
      targets.push(...kept);
    }

    // Volt Graphite palette: 85% silver ink, 15% electric blue accent
    const silver = "rgb(230,232,235)";
    const volt = "rgb(46,111,255)";
    const sample = () => (Math.random() < 0.15 ? volt : silver);


    const particles: P[] = targets.map((t) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.max(w, h) * (0.6 + Math.random() * 0.5);
      return {
        x: w / 2 + Math.cos(angle) * radius,
        y: h / 2 + Math.sin(angle) * radius,
        tx: t.x,
        ty: t.y,
        vx: 0,
        vy: 0,
        c: sample(),
        sx: 0,
        sy: 0,
      };
    });

    let raf = 0;
    const start = performance.now();
    let scattering = false;

    const tick = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, w, h);

      if (elapsed >= scatterAtMs && !scattering) {
        scattering = true;
        for (const p of particles) {
          const dx = p.x - w / 2;
          const dy = p.y - h / 2;
          const d = Math.hypot(dx, dy) || 1;
          p.vx = (dx / d) * (6 + Math.random() * 6);
          p.vy = (dy / d) * (6 + Math.random() * 6);
        }
      }

      const shimmer = 0.75 + Math.sin(elapsed / 90) * 0.25;

      for (const p of particles) {
        if (scattering) {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.98;
          p.vy *= 0.98;
        } else {
          const dx = p.tx - p.x;
          const dy = p.ty - p.y;
          p.vx = (p.vx + dx * 0.03) * 0.82;
          p.vy = (p.vy + dy * 0.03) * 0.82;
          p.x += p.vx;
          p.y += p.vy;
        }
        ctx.globalAlpha = scattering ? Math.max(0, 1 - (elapsed - scatterAtMs) / 500) : shimmer;
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, 1.7, 1.7);
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [text, scatterAtMs]);

  return <canvas ref={canvasRef} className={cn("block", className)} aria-hidden="true" />;
}

export default ParticleLogo;
