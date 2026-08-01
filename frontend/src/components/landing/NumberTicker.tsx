import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { gsap } from "gsap";
import { useDevicePerformance } from "@/hooks/useDevicePerformance";
import { useLenis } from "@/components/landing/LenisProvider";
import { bindLenisOnce, loadScrollTrigger } from "@/lib/scrollTrigger";

interface Props {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

export function NumberTicker({ value, suffix = "", prefix = "", duration = 1600 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const reduce = useReducedMotion();
  const { isLowTier } = useDevicePerformance();
  const lenis = useLenis();
  const [n, setN] = useState(0);

  const useScrollScrub = !reduce && !isLowTier;

  // Fallback: one-shot rAF count-up once scrolled into view.
  useEffect(() => {
    if (useScrollScrub) return;
    if (!inView) return;
    if (reduce) {
      setN(value);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [useScrollScrub, inView, value, duration, reduce]);

  // Scroll-scrubbed: the count tracks scroll progress through a window
  // around the stat, including counting back down on scroll-up — the
  // clearest signal that this is actually tied to scroll, not a one-shot.
  useEffect(() => {
    if (!useScrollScrub) return;
    const el = ref.current;
    if (!el) return;

    let ctx: gsap.Context | undefined;
    let cancelled = false;

    loadScrollTrigger().then(({ ScrollTrigger }) => {
      if (cancelled || !el) return;
      if (lenis) bindLenisOnce(lenis, ScrollTrigger);

      ctx = gsap.context(() => {
        const counter = { val: 0 };
        gsap.to(counter, {
          val: value,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            end: "top 45%",
            scrub: 0.4,
          },
          onUpdate: () => {
            el.textContent = `${prefix}${Math.round(counter.val).toLocaleString()}${suffix}`;
          },
        });
      });
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useScrollScrub, lenis, value, prefix, suffix]);

  return (
    <span ref={ref} className="tabular-nums">
      {useScrollScrub ? `${prefix}0${suffix}` : `${prefix}${n.toLocaleString()}${suffix}`}
    </span>
  );
}
