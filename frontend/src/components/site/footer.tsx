import { Link } from "@tanstack/react-router";
import { Github, Twitter, Linkedin } from "lucide-react";

const cols = [
  {
    title: "Product",
    links: [
      { label: "Browse jobs", to: "/jobs" as const },
      { label: "Companies", to: "/companies" as const },
      { label: "Post a job", to: "/post" as const },
      { label: "Resources", to: "/resources" as const },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" as const },
      { label: "Blog", to: "/blog" as const },
      { label: "Contact", to: "/contact" as const },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/#terms" },
      { label: "Privacy", href: "/#privacy" },
      { label: "Cookies", href: "/#cookies" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-border">
      <div className="container-page py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="flex items-center gap-2 text-body font-heading tracking-tight">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-foreground text-background text-[11px] font-display">D</span>
              <span>jOBiON</span>
            </Link>
            <p className="mt-4 max-w-xs text-small leading-relaxed text-secondary">
              The AI-native job board built for developers. Find roles that fit, hire engineers that ship.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a aria-label="Twitter" href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 place-items-center rounded-full border border-border text-secondary transition-colors hover:text-foreground">
                <Twitter className="h-3.5 w-3.5" />
              </a>
              <a aria-label="GitHub" href="https://github.com" target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 place-items-center rounded-full border border-border text-secondary transition-colors hover:text-foreground">
                <Github className="h-3.5 w-3.5" />
              </a>
              <a aria-label="LinkedIn" href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 place-items-center rounded-full border border-border text-secondary transition-colors hover:text-foreground">
                <Linkedin className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <div className="eyebrow mb-4">{col.title}</div>
              <ul className="space-y-3 text-small">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {"to" in l && l.to ? (
                      <Link to={l.to} className="text-secondary transition-colors hover:text-foreground">{l.label}</Link>
                    ) : (
                      <a href={l.href} className="text-secondary transition-colors hover:text-foreground">{l.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-border pt-8 text-micro text-secondary sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} jOBiON. All rights reserved.</p>
          <p>Built for builders.</p>
        </div>
      </div>
    </footer>
  );
}
