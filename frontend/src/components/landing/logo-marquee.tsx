import * as SimpleIcons from "simple-icons";

const BRAND_SLUGS = ["stripe", "vercel", "openai", "linear", "github", "react"];

function LogoChip({ slug }: { slug: string }) {
  const icon = (SimpleIcons as any)[`si${slug.charAt(0).toUpperCase() + slug.slice(1)}`];
  
  if (!icon) return null;

  return (
    <div className="flex shrink-0 items-center gap-3 px-8">
      <span className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-card text-foreground">
        <svg
          role="img"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d={icon.path} />
        </svg>
      </span>
      <span className="text-[15px] font-medium tracking-tight text-muted-foreground/90">
        {icon.title}
      </span>
    </div>
  );
}

export function LogoMarquee() {
  const row = BRAND_SLUGS;
  const doubled = [...row, ...row, ...row];

  return (
    <section className="py-16">
      <div className="container-page text-center">
        <p className="eyebrow">Trusted by teams hiring on jOBiON</p>
      </div>
      <div className="relative mt-10 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-background to-transparent" />
        <div className="group flex">
          <div className="marquee-track group-hover:marquee-pause flex min-w-max items-center">
            {doubled.map((slug, i) => (
              <LogoChip key={`${slug}-${i}`} slug={slug} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
