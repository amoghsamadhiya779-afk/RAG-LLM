import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface PixelCanvasProps {
  gap?: number;
  speed?: number;
  colors?: string[];
  variant?: "default" | "icon";
  noFocus?: boolean;
  className?: string;
}

class Pixel {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  color: string;
  speed: number;
  size = 0;
  sizeStep: number;
  minSize = 0.5;
  maxSizeInteger = 2;
  maxSize: number;
  delay: number;
  counter = 0;
  counterStep: number;
  isIdle = false;
  isReverse = false;
  isShimmer = false;

  constructor(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    speed: number,
    delay: number
  ) {
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.color = color;
    this.speed = this.getRandomValue(0.1, 0.9) * speed;
    this.sizeStep = Math.random() * 0.4;
    this.maxSize = this.getRandomValue(this.minSize, this.maxSizeInteger);
    this.delay = delay;
    this.counterStep = Math.random() * 4 + (this.ctx.canvas.width + this.ctx.canvas.height) * 0.01;
  }

  getRandomValue(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  draw() {
    const centerOffset = this.maxSizeInteger * 0.5 - this.size * 0.5;
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(this.x + centerOffset, this.y + centerOffset, this.size, this.size);
  }

  appear() {
    this.isIdle = false;
    if (this.counter <= this.delay) {
      this.counter += this.counterStep;
      return;
    }
    if (this.size >= this.maxSize) this.isShimmer = true;
    if (this.isShimmer) this.shimmer();
    else this.size += this.sizeStep;
    this.draw();
  }

  disappear() {
    this.isShimmer = false;
    this.counter = 0;
    if (this.size <= 0) {
      this.isIdle = true;
      return;
    }
    this.size -= 0.1;
    this.draw();
  }

  shimmer() {
    if (this.size >= this.maxSize) this.isReverse = true;
    else if (this.size <= this.minSize) this.isReverse = false;
    if (this.isReverse) this.size -= this.speed;
    else this.size += this.speed;
  }
}

function getDistanceToCanvasCenter(canvas: HTMLCanvasElement, x: number, y: number) {
  const dx = x - canvas.width / 2;
  const dy = y - canvas.height / 2;
  return Math.sqrt(dx * dx + dy * dy);
}

export function PixelCanvas({
  gap = 5,
  speed = 35,
  colors = ["#f8fafc", "#f1f5f9", "#cbd5e1"],
  variant = "default",
  className,
}: PixelCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<Pixel[]>([]);
  const rafRef = useRef<number | null>(null);
  const timeRef = useRef<number>(performance.now());
  const timeIntervalRef = useRef<number>(1000 / 60);
  const stateRef = useRef<"appear" | "disappear">("appear");
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    reduceMotionRef.current = reduce;

    const clampedGap = Math.max(4, gap);
    const effectiveSpeed = reduce ? 0 : Math.max(0, Math.min(100, speed)) * 0.001;

    function createPixels() {
      if (!ctx || !canvas) return;
      pixelsRef.current = [];
      for (let x = 0; x < canvas.width; x += clampedGap) {
        for (let y = 0; y < canvas.height; y += clampedGap) {
          const color = colors[Math.floor(Math.random() * colors.length)];
          let delay = 0;
          if (variant === "icon") {
            delay = reduce ? 0 : getDistanceToCanvasCenter(canvas, x, y);
          } else {
            delay = reduce ? 0 : Math.random() * (canvas.width + canvas.height) * 0.5;
          }
          pixelsRef.current.push(
            new Pixel(ctx, x, y, color, effectiveSpeed, delay)
          );
        }
      }
    }

    function resize() {
      if (!wrapper || !canvas) return;
      const rect = wrapper.getBoundingClientRect();
      canvas.width = Math.floor(rect.width);
      canvas.height = Math.floor(rect.height);
      createPixels();
    }

    function animate(kind: "appear" | "disappear") {
      stateRef.current = kind;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const loop = () => {
        rafRef.current = requestAnimationFrame(loop);
        const now = performance.now();
        const passed = now - timeRef.current;
        if (passed < timeIntervalRef.current) return;
        timeRef.current = now - (passed % timeIntervalRef.current);
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let allIdle = true;
        for (const p of pixelsRef.current) {
          if (stateRef.current === "appear") p.appear();
          else {
            p.disappear();
            if (!p.isIdle) allIdle = false;
          }
        }
        if (stateRef.current === "disappear" && allIdle && rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      };
      loop();
    }

    resize();
    animate("appear");

    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);

    const onVisibility = () => {
      if (document.hidden) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else {
        animate("appear");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [gap, speed, variant, colors]);

  return (
    <div ref={wrapperRef} className={cn("h-full w-full", className)}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
