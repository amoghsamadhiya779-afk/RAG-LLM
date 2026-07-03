import { useEffect, useRef } from "react";

interface ParticleTextEffectProps {
  words?: string[];
  onComplete?: () => void;
  loop?: boolean;
  interactive?: boolean;
  holdFrames?: number;
}

const DEFAULT_WORDS = ["jOBiON"];

const BRAND_COLORS = [
  { r: 6, g: 182, b: 212 },
  { r: 20, g: 184, b: 166 },
  { r: 163, g: 230, b: 53 },
];

type RGB = { r: number; g: number; b: number };

class Particle {
  x: number;
  y: number;
  dest: { x: number; y: number };
  vx = 0;
  vy = 0;
  r: number;
  color: RGB;
  targetColor: RGB;

  constructor(x: number, y: number, destX: number, destY: number, color: RGB) {
    this.x = x;
    this.y = y;
    this.dest = { x: destX, y: destY };
    this.r = Math.random() * 1.6 + 0.6;
    this.color = { r: 255, g: 255, b: 255 };
    this.targetColor = color;
  }

  update() {
    const dx = this.dest.x - this.x;
    const dy = this.dest.y - this.y;
    this.vx = (this.vx + dx * 0.008) * 0.86;
    this.vy = (this.vy + dy * 0.008) * 0.86;
    this.x += this.vx;
    this.y += this.vy;
    this.color.r += (this.targetColor.r - this.color.r) * 0.06;
    this.color.g += (this.targetColor.g - this.color.g) * 0.06;
    this.color.b += (this.targetColor.b - this.color.b) * 0.06;
  }
}

export function ParticleTextEffect({
  words = DEFAULT_WORDS,
  onComplete,
  loop = false,
  interactive = false,
  holdFrames = 200,
}: ParticleTextEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const wordIndexRef = useRef(0);
  const completedRef = useRef(false);
  const mouseRef = useRef({ x: -9999, y: -9999, down: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const vw = window.innerWidth;
    const isMobile = vw < 768;
    const isSmall = vw < 480;
    // Denser targets on all devices; step controls sampling grid.
    const pixelSteps = isSmall ? 6 : isMobile ? 5 : 4;

    const resize = () => {
      const parent = canvas.parentElement;
      const cssW = Math.min(parent?.clientWidth ?? window.innerWidth, 1400);
      const cssH = Math.min(parent?.clientHeight ?? window.innerHeight, 700);
      // Cap backing store on mobile to keep RAF cheap; desktop uses dpr.
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 2);
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    const cssWidth = () => canvas.clientWidth || canvas.width;
    const cssHeight = () => canvas.clientHeight || canvas.height;

    const nextWord = (word: string) => {
      const w = cssWidth();
      const h = cssHeight();
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const octx = off.getContext("2d");
      if (!octx) return;

      const fontSize = Math.min(w * 0.18, 220);
      octx.fillStyle = "#fff";
      octx.textAlign = "center";
      octx.textBaseline = "middle";
      octx.font = `bold ${fontSize}px Inter, Arial, sans-serif`;
      octx.fillText(word, w / 2, h / 2);

      const img = octx.getImageData(0, 0, w, h).data;
      const targets: { x: number; y: number; color: RGB }[] = [];
      for (let y = 0; y < h; y += pixelSteps) {
        for (let x = 0; x < w; x += pixelSteps) {
          const i = (y * w + x) * 4;
          if (img[i + 3] > 128) {
            targets.push({
              x,
              y,
              color:
                BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)],
            });
          }
        }
      }

      const existing = particlesRef.current;
      const spread = Math.max(w, h) * 1.6; // ultra-scattered origin
      const cx = w / 2;
      const cy = h / 2;
      for (let i = 0; i < targets.length; i++) {
        const t = targets[i];
        // Start each particle far from center in a random direction.
        const angle = Math.random() * Math.PI * 2;
        const dist = spread * (0.6 + Math.random() * 0.9);
        const sx = cx + Math.cos(angle) * dist;
        const sy = cy + Math.sin(angle) * dist;
        if (existing[i]) {
          existing[i].dest.x = t.x;
          existing[i].dest.y = t.y;
          existing[i].targetColor = t.color;
          existing[i].x = sx;
          existing[i].y = sy;
          existing[i].vx = 0;
          existing[i].vy = 0;
        } else {
          existing.push(new Particle(sx, sy, t.x, t.y, t.color));
        }
      }
      existing.length = targets.length;
    };

    nextWord(words[0] ?? "");

    const animate = () => {
      ctx.fillStyle = "rgba(10, 15, 20, 0.16)";
      ctx.fillRect(0, 0, cssWidth(), cssHeight());

      const parts = particlesRef.current;
      for (const p of parts) {
        if (interactive && mouseRef.current.x > -9000) {
          const dx = p.x - mouseRef.current.x;
          const dy = p.y - mouseRef.current.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 6000) {
            const f = 60 / Math.max(d2, 100);
            p.vx += dx * f * 0.02;
            p.vy += dy * f * 0.02;
          }
        }
        p.update();
        ctx.fillStyle = `rgb(${p.color.r|0},${p.color.g|0},${p.color.b|0})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      frameCountRef.current++;
      if (loop) {
        if (frameCountRef.current % 240 === 0) {
          wordIndexRef.current = (wordIndexRef.current + 1) % words.length;
          nextWord(words[wordIndexRef.current]);
        }
      } else if (!completedRef.current && frameCountRef.current >= holdFrames) {
        completedRef.current = true;
        onComplete?.();
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };
    if (interactive) canvas.addEventListener("mousemove", onMove);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      if (interactive) canvas.removeEventListener("mousemove", onMove);
    };
  }, [words, loop, interactive, holdFrames, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
