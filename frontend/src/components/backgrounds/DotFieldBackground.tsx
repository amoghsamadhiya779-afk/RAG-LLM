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
  if (pathname === '/') return null;

  // Accessibility: don't render constant animation if requested
  if (prefersReducedMotion) return null;

  // Theme tints (Brand: Volt Graphite blue)
  const isDark = resolvedTheme === 'dark';
  const gradientFrom = isDark ? 'rgba(46,111,255,0.22)' : 'rgba(37,87,230,0.15)';
  const gradientTo = isDark ? 'rgba(106,162,255,0.10)' : 'rgba(37,87,230,0.06)';
  const glowColor = isDark ? 'rgba(46,111,255,0.10)' : 'rgba(37,87,230,0.07)';

  return (
    <div className="dot-field-ambient" aria-hidden="true">
      <React.Suspense fallback={null}>
        <DotField
          key={resolvedTheme} // force re-mount on theme toggle to instantly snap gradient
          dotRadius={1.5}
          dotSpacing={16}
          cursorRadius={420}
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
