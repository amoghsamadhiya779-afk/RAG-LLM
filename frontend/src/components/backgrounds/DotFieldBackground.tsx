import React, { useEffect, useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import { useTheme } from '../theme/ThemeProvider';

// Lazy load the heavy canvas component so it doesn't block initial hydration
const DotField = React.lazy(() => import('./DotField'));

export default function DotFieldBackground() {
  const { pathname } = useLocation();
  const { resolvedTheme } = useTheme();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Exclude from landing page (which has its own background)
  // Removed per user request to have dot grid element in the entire background

  // Accessibility: don't render constant animation if requested
  if (prefersReducedMotion) return null;

  // Theme tints (Brand: Volt Graphite blue)
  const isDark = resolvedTheme === 'dark';
  // Use static dark values. CSS filter invert will seamlessly handle light mode!
  const gradientFrom = 'rgba(46,111,255,0.30)';
  const gradientTo = 'rgba(106,162,255,0.14)';
  const glowColor = 'rgba(46,111,255,0.14)';

  return (
    <div className="dot-field-ambient" aria-hidden="true">
      <React.Suspense fallback={null}>
        <DotField
          dotRadius={1.5}
          dotSpacing={16}
          cursorRadius={420}
          style={{
            filter: isDark ? "invert(0) hue-rotate(0deg)" : "invert(1) hue-rotate(180deg)",
            opacity: isDark ? 1 : 0.2,
          }}
          bulgeOnly={true}
          bulgeStrength={48}
          glowRadius={180}
          sparkle={false}
          waveAmplitude={0}
          gradientFrom={gradientFrom}
          gradientTo={gradientTo}
          glowColor={glowColor}
        />
      </React.Suspense>
    </div>
  );
}
