import { Link } from "@tanstack/react-router";
import { JobionWordmark } from "@/components/brand/JobionLogo";

export function Footer() {
  const cols = [
    {
      title: "Product",
      links: [
        { label: "Jobs", href: "/jobs" },
        { label: "Resume AI", href: "/dashboard/resume" },
        { label: "ATS Score", href: "/dashboard" },
        { label: "Features", href: "/features" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Contact", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "#" },
        { label: "Terms", href: "#" },
        { label: "Security", href: "#" },
        { label: "Cookies", href: "#" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border/60 bg-background/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div className="space-y-3">
          <Link to="/" aria-label="jOBiON home" className="inline-block">
            <JobionWordmark className="text-base text-muted-foreground [&_span]:!text-muted-foreground [&_span]:!bg-none [&_span]:!bg-clip-border [&_span]:!text-muted-foreground" />
          </Link>
          <p className="text-sm text-muted-foreground">
            Premium tech jobs, AI resume analysis, and ATS scoring — in one place.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {c.title}
            </h4>
            <ul className="space-y-2 text-sm">
              {c.links.map((l) => (
                <li key={l.label}>
                  {l.href.startsWith("/") ? (
                    <Link
                      to={l.href as "/"}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  ) : (
                    <a href={l.href} className="text-muted-foreground hover:text-foreground">
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60 px-6 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} jOBiON. All rights reserved.
      </div>
    </footer>
  );
}
