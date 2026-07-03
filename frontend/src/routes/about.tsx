import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Github, Linkedin, Twitter } from "lucide-react";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Button } from "@/components/ui/button";
import { reveal, revealStagger, viewportOnce } from "@/lib/motion";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — jOBiON" },
      { name: "description", content: "We're building the AI-native job board developers actually want to use." },
      { property: "og:title", content: "About jOBiON" },
      { property: "og:description", content: "Our mission: replace keyword roulette with semantic matching." },
    ],
  }),
  component: AboutPage,
});

const values = [
  { title: "Candidates first", body: "Every algorithm we ship answers one question: does this role fit you, right now?" },
  { title: "Signal over noise", body: "No paywalls on quality. No SEO-bait listings. Only roles you can actually apply to." },
  { title: "Build in public", body: "Open changelog, public roadmap, and a Discord where the team reads every message." },
];

const team = [
  { name: "Maya Chen", role: "Co-founder, Engineering", initials: "MC" },
  { name: "Ari Okafor", role: "Co-founder, Product", initials: "AO" },
  { name: "Sam Reyes", role: "ML & Search", initials: "SR" },
  { name: "Jules Park", role: "Design", initials: "JP" },
];

function AboutPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="container-page pt-24 pb-20">
          <motion.div initial="hidden" whileInView="show" viewport={viewportOnce} variants={revealStagger} className="max-w-3xl">
            <motion.p variants={reveal} className="eyebrow">About</motion.p>
            <motion.h1 variants={reveal} className="h-display mt-4 text-display md:text-display">
              We're rebuilding the job board, <span className="brand-gradient-text">from the model up.</span>
            </motion.h1>
            <motion.p variants={reveal} className="mt-6 text-body-lg leading-relaxed text-secondary">
              jOBiON started as a weekend RAG experiment: could a language model read a thousand job posts and tell you the three that actually match what you've shipped? It could — and the answer was so much better than keyword search that we quit our jobs to build it.
            </motion.p>
            <motion.div variants={reveal} className="mt-8 flex flex-wrap gap-3">
              <Link to="/jobs"><Button size="lg" className="rounded-full">Browse roles<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              <Link to="/contact"><Button size="lg" variant="ghost" className="rounded-full">Get in touch</Button></Link>
            </motion.div>
          </motion.div>
        </section>

        <section className="container-page py-20">
          <motion.div initial="hidden" whileInView="show" viewport={viewportOnce} variants={revealStagger} className="grid gap-6 md:grid-cols-3">
            {values.map((v) => (
              <motion.div key={v.title} variants={reveal} className="rounded-lg border border-border bg-card p-8">
                <h3 className="text-body-lg font-heading tracking-tight">{v.title}</h3>
                <p className="mt-3 text-small leading-relaxed text-secondary">{v.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className="container-page py-20">
          <div className="mb-10">
            <p className="eyebrow">Team</p>
            <h2 className="h-display mt-3 text-h2 md:text-h1">Small team. Big roadmap.</h2>
          </div>
          <motion.div initial="hidden" whileInView="show" viewport={viewportOnce} variants={revealStagger} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((m) => (
              <motion.div key={m.name} variants={reveal} className="rounded-lg border border-border bg-card p-6">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 text-small font-heading text-white">
                  {m.initials}
                </div>
                <div className="mt-5 text-body font-heading">{m.name}</div>
                <div className="text-small text-secondary">{m.role}</div>
                <div className="mt-4 flex gap-2 text-secondary">
                  <Twitter className="h-4 w-4" />
                  <Github className="h-4 w-4" />
                  <Linkedin className="h-4 w-4" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
