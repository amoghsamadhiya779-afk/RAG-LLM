import { useEffect, useState } from "react";
import { PixelCanvas } from "@/components/ui/pixel-canvas";

function sample(className: string): string | null {
  if (typeof document === "undefined") return null;
  const el = document.createElement("div");
  el.className = className;
  el.style.position = "absolute";
  el.style.opacity = "0";
  el.style.pointerEvents = "none";
  document.body.appendChild(el);
  const color = getComputedStyle(el).color;
  document.body.removeChild(el);
  return color || null;
}

export function PixelBackground() {
  const [colors, setColors] = useState<string[]>([]);

  useEffect(() => {
    const muted = sample("text-muted-foreground") ?? "rgb(148,163,184)";
    const primary = sample("text-primary") ?? "rgb(6,182,212)";
    const accent = sample("text-accent") ?? "rgb(163,230,53)";
    // Weighted: mostly muted grid with brand cyan + lime sparks.
    setColors([muted, muted, muted, muted, primary, accent]);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {colors.length > 0 && (
        <PixelCanvas gap={10} speed={30} colors={colors} variant="default" />
      )}
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(circle at center, transparent 0%, var(--background) 100%)",
        }}
      />
    </div>
  );
}
