import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BookOpen, FileText, Code2, GraduationCap, Lightbulb, Wrench } from "lucide-react";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { reveal, revealStagger, viewportOnce } from "@/lib/motion";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Resources — jOBiON" },
      { name: "description", content: "Guides, templates, and tools for job seekers and hiring teams." },
      { property: "og:title", content: "jOBiON Resources" },
      { property: "og:description", content: "Free guides, templates, and tools for job seekers and hiring teams." },
    ],
  }),
  component: ResourcesPage,
});

const groups = [
  {
    title: "For candidates",
    items: [
      { icon: FileText, title: "Resume template kit", desc: "Three battle-tested layouts that parse cleanly in every ATS.", to: "/blog" as const },
      { icon: Lightbulb, title: "Negotiation playbook", desc: "Scripts and ranges for the offer conversation.", to: "/blog" as const },
      { icon: GraduationCap, title: "Interview prep tracks", desc: "Frontend, backend, infra, ML — one curated path each.", to: "/blog" as const },
    ],
  },
  {
    title: "For employers",
    items: [
      { icon: BookOpen, title: "Hiring rubric library", desc: "Open rubrics for screens, take-homes, and onsites.", to: "/blog" as const },
      { icon: Wrench, title: "Job description teardowns", desc: "Before / after rewrites that double qualified inbound.", to: "/blog" as const },
      { icon: Code2, title: "ATS integration docs", desc: "Wire jOBiON to Greenhouse, Lever, and Ashby in an afternoon.", to: "/blog" as const },
    ],
  },
];

function ResourcesPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="container-page pt-24 pb-12">
          <motion.div initial="hidden" whileInView="show" viewport={viewportOnce} variants={revealStagger} className="max-w-3xl">
            <motion.p variants={reveal} className="eyebrow">Resources</motion.p>
            <motion.h1 variants={reveal} className="h-display mt-4 text-display md:text-display">
              Free playbooks for <span className="brand-gradient-text">both sides of the hire.</span>
            </motion.h1>
            <motion.p variants={reveal} className="mt-5 text-body-lg text-secondary">
              Templates, rubrics, and guides we use ourselves. No email gate, no upsell.
            </motion.p>
          </motion.div>
        </section>

        {groups.map((group) => (
          <section key={group.title} className="container-page py-12">
            <h2 className="text-h3 font-heading tracking-tight">{group.title}</h2>
            <motion.div initial="hidden" whileInView="show" viewport={viewportOnce} variants={revealStagger} className="mt-8 grid gap-6 md:grid-cols-3">
              {group.items.map((item) => (
                <motion.div key={item.title} variants={reveal}>
                  <Link to={item.to} className="group block h-full rounded-lg border border-border bg-card p-6 transition-colors hover:border-foreground/30">
                    <div className="grid h-10 w-10 place-items-center rounded-md bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 text-white">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-body font-heading tracking-tight">{item.title}</h3>
                    <p className="mt-2 text-small text-secondary">{item.desc}</p>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </section>
        ))}

        <section className="container-page py-20" />
      </main>
      <SiteFooter />
    </div>
  );
}
