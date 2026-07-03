import { Reveal, StaggerGroup, GlassPanel } from "@/components/ui-ext";

const QUOTES = [
  {
    quote: "Got 3 offers in 2 weeks. The ATS score was the missing piece — no more black holes.",
    name: "Priya S.",
    role: "Senior Frontend Engineer",
  },
  {
    quote: "The AI resume rewrites are shockingly good. Tailored per job in seconds.",
    name: "Marcus L.",
    role: "Staff SRE",
  },
  {
    quote: "Finally a job board that doesn't feel like it was built in 2012.",
    name: "Ana M.",
    role: "Design Engineer",
  },
];

export function Testimonials() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Loved by builders</p>
          <h2 className="mt-3 text-4xl sm:text-5xl">Real hires. Real fast.</h2>
        </Reveal>
        <StaggerGroup className="mt-14 grid gap-6 md:grid-cols-3">
          {QUOTES.map((q) => (
            <GlassPanel key={q.name} className="p-6">
              <p className="text-lg leading-snug">"{q.quote}"</p>
              <div className="mt-6 flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-full"
                  style={{ background: "var(--gradient-brand)" }}
                />
                <div>
                  <p className="text-sm font-medium">{q.name}</p>
                  <p className="text-xs text-muted-foreground">{q.role}</p>
                </div>
              </div>
            </GlassPanel>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
