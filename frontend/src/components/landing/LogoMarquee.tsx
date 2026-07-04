const LOGOS = [
  "Vercel",
  "Linear",
  "Stripe",
  "Supabase",
  "Anthropic",
  "Ramp",
  "Notion",
  "Figma",
  "Cloudflare",
  "OpenAI",
];

export function LogoMarquee() {
  const row = [...LOGOS, ...LOGOS];
  return (
    <section aria-label="Trusted by teams" className="relative border-y border-border/60 bg-background/40 py-10">
      <p className="mb-6 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">
        Trusted by engineers at
      </p>
      <div
        className="group relative overflow-hidden"
        style={{ maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}
      >
        <div className="flex w-max animate-marquee gap-14 pr-14">
          {row.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="whitespace-nowrap text-2xl font-semibold tracking-tight text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
