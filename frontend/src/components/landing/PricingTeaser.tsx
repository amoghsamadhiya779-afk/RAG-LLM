import { Link } from "@tanstack/react-router";
import {
  Briefcase,
  FileText,
  Gauge,
  LayoutDashboard,
  Send,
  Bookmark,
  PlusSquare,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Reveal, GlassPanel } from "@/components/ui-ext";
import { GradientText } from "@/components/ui-ext/GradientText";

const FEATURES = [
  { to: "/jobs", label: "Curated jobs", desc: "Filter by stack, remote, salary — no noise.", Icon: Briefcase },
  { to: "/dashboard/resume", label: "AI resume analysis", desc: "Upload once, get structured feedback in seconds.", Icon: FileText },
  { to: "/dashboard/ats", label: "ATS score", desc: "See how bots read you before recruiters do.", Icon: Gauge },
  { to: "/dashboard", label: "Personal dashboard", desc: "Applications, saves, recommendations in one view.", Icon: LayoutDashboard },
  { to: "/dashboard/applications", label: "Application tracker", desc: "Status timeline, filters, no spreadsheets.", Icon: Send },
  { to: "/saved", label: "Saved jobs", desc: "Bookmark roles, come back when you're ready.", Icon: Bookmark },
  { to: "/employer/jobs/new", label: "Post a job free", desc: "Publish roles with a live preview — zero fees.", Icon: PlusSquare },
  { to: "/features", label: "Every feature, unlocked", desc: "No plans, no paywalls. Sign in only where personal.", Icon: Sparkles },
] as const;

export function PricingTeaser() {
  return (
    <section id="features" className="relative py-16 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Everything, free</p>
          <h2 className="mt-3 text-4xl sm:text-5xl">
            No plans. No paywalls. <GradientText>Just the tools.</GradientText>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every feature is reachable from the floating dock at the top of the screen.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Reveal key={f.to}>
              <Link to={f.to as never} className="group block h-full">
                <GlassPanel className="relative h-full p-5 transition-transform group-hover:-translate-y-0.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-foreground/80">
                    <f.Icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold tracking-tight">{f.label}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-[0.18em] text-primary/80 transition-colors group-hover:text-primary">
                    Open <ArrowRight className="h-3 w-3" />
                  </span>
                </GlassPanel>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
