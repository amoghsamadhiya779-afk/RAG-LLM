import { Reveal } from "@/components/ui-ext";
import { NumberTicker } from "./NumberTicker";

const STATS = [
  { value: 12400, suffix: "+", label: "Open roles indexed" },
  { value: 96, suffix: "%", label: "ATS pass rate" },
  { value: 3200, suffix: "+", label: "Resumes analyzed" },
  { value: 45, suffix: "s", label: "Avg analysis time" },
];

export function StatsBand() {
  return (
    <section className="relative border-y border-border/60 py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ backgroundImage: "var(--gradient-brand-soft)" }}
      />
      <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-10 px-6 md:grid-cols-4">
        {STATS.map((s) => (
          <Reveal key={s.label} className="text-center">
            <div className="text-4xl font-semibold tracking-tight sm:text-5xl">
              <NumberTicker value={s.value} suffix={s.suffix} />
            </div>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
