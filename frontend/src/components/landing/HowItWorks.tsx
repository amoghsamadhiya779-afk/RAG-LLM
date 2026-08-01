import { memo, useEffect, useRef } from "react";
import { FileText, Sparkles, Send } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { gsap } from "gsap";
import { Reveal, StaggerGroup, GlassPanel } from "@/components/ui-ext";
import { useDevicePerformance } from "@/hooks/useDevicePerformance";
import { useLenis } from "@/components/landing/LenisProvider";
import { bindLenisOnce, loadScrollTrigger } from "@/lib/scrollTrigger";

const STEPS = [
  {
    icon: FileText,
    title: "Upload your resume",
    body: "PDF or DOCX. We parse it into structured data — skills, experience, education — in seconds.",
  },
  {
    icon: Sparkles,
    title: "Get your ATS score",
    body: "See exactly what applicant tracking systems will extract, plus AI suggestions tailored to each role.",
  },
  {
    icon: Send,
    title: "Apply with confidence",
    body: "One-click apply to curated tech jobs with a resume version tuned to that job's keywords.",
  },
];

function StepCard({ step, index }: { step: (typeof STEPS)[number]; index: number }) {
  return (
    <GlassPanel className="how-step group relative overflow-hidden p-6">
      <div
        className="absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
        style={{ background: "var(--gradient-brand)" }}
      />
      <div className="relative">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
            style={{ background: "var(--gradient-brand)" }}
          >
            <step.icon className="h-5 w-5" />
          </div>
          <span className="text-xs font-mono text-muted-foreground">0{index + 1}</span>
        </div>
        <h3 className="mt-5 text-xl">{step.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
      </div>
    </GlassPanel>
  );
}

// Memoized because GSAP's ScrollTrigger pin reparents the grid into a
// spacer div outside React's knowledge. If an unrelated ancestor re-renders
// (e.g. SessionProvider's auth-retry state) and React tries to reconcile
// this subtree against the DOM shape it remembers, it crashes with
// "removeChild: not a child of this node". Taking no props means this only
// re-renders from its own hooks changing, never from a parent re-render.
function HowItWorksImpl() {
  const reducedMotion = useReducedMotion();
  const { isLowTier } = useDevicePerformance();
  const lenis = useLenis();
  const gridRef = useRef<HTMLDivElement>(null);

  // isLowTier already covers mobile viewports (useDevicePerformance treats
  // any <=768px width as low-tier), so pinning never activates on phones —
  // no separate mobile check needed.
  const enableScrollytelling = !isLowTier && !reducedMotion;

  useEffect(() => {
    if (!enableScrollytelling) return;
    let ctx: gsap.Context | undefined;
    let cancelled = false;

    loadScrollTrigger().then(({ ScrollTrigger }) => {
      if (cancelled || !gridRef.current) return;
      if (lenis) bindLenisOnce(lenis, ScrollTrigger);

      ctx = gsap.context(() => {
        const steps = gsap.utils.toArray<HTMLElement>(".how-step", gridRef.current!);
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top top+=80",
            end: "+=120%",
            scrub: 0.6,
            pin: true,
            anticipatePin: 1,
          },
        });
        steps.forEach((step, i) => {
          tl.fromTo(
            step,
            { autoAlpha: i === 0 ? 1 : 0.25, y: i === 0 ? 0 : 40, scale: i === 0 ? 1 : 0.96 },
            { autoAlpha: 1, y: 0, scale: 1, ease: "none", duration: i === 0 ? 0.4 : 1 },
            i === 0 ? 0 : i * 0.9 - 0.1,
          );
        });
      }, gridRef);
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableScrollytelling, lenis]);

  return (
    <section id="how" className="relative py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">How it works</p>
          <h2 className="mt-3 text-4xl sm:text-5xl">Three steps to your next role</h2>
          <p className="mt-4 text-muted-foreground">
            Built for engineers, designers, and PMs who are tired of shouting into ATS void.
          </p>
        </Reveal>

        {enableScrollytelling ? (
          <div ref={gridRef} className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <StepCard key={s.title} step={s} index={i} />
            ))}
          </div>
        ) : (
          <StaggerGroup className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <StepCard key={s.title} step={s} index={i} />
            ))}
          </StaggerGroup>
        )}
      </div>
    </section>
  );
}

export const HowItWorks = memo(HowItWorksImpl);
