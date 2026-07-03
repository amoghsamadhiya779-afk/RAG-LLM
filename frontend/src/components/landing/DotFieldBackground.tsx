import { useEffect, useState } from "react";
import DotField from "./DotField";

const BASE_PROPS = {
  dotRadius: 1.5,
  dotSpacing: 16,
  cursorRadius: 420,
  bulgeOnly: true,
  bulgeStrength: 48,
  glowRadius: 180,
  sparkle: false,
  waveAmplitude: 0,
};

const DARK_TINT = {
  gradientFrom: "rgba(46, 111, 255, 0.22)",
  gradientTo: "rgba(106, 162, 255, 0.10)",
  glowColor: "rgba(46, 111, 255, 0.10)",
};

const LIGHT_TINT = {
  gradientFrom: "rgba(37, 87, 230, 0.15)",
  gradientTo: "rgba(37, 87, 230, 0.06)",
  glowColor: "rgba(37, 87, 230, 0.07)",
};

function canRunDotField() {
  if (typeof window === "undefined") return false;
  const fine = window.matchMedia("(pointer: fine)").matches;
  const wide = window.innerWidth >= 768;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return fine && wide && !reduced;
}

export default function DotFieldBackground() {
  const [isDark, setIsDark] = useState(true);
  const [canRun, setCanRun] = useState(false);

  useEffect(() => {
    setCanRun(canRunDotField());
    
    // Check if we are in dark mode (defaulting to true for Volt Graphite)
    const checkTheme = () => {
      setIsDark(!document.documentElement.classList.contains('light'));
    };
    
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  if (!canRun) return null;

  const tint = isDark ? DARK_TINT : LIGHT_TINT;

  return (
    <div className="dot-field-ambient" aria-hidden="true">
      <DotField key={isDark ? 'dark' : 'light'} {...BASE_PROPS} {...tint} />
    </div>
  );
}
