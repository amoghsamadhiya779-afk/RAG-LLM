import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageCircle, MapPin, Send, Check } from "lucide-react";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { reveal, revealStagger, viewportOnce } from "@/lib/motion";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — jOBiON" },
      { name: "description", content: "Questions, feedback, partnerships — we read every message." },
      { property: "og:title", content: "Contact jOBiON" },
      { property: "og:description", content: "Reach the team — usually a reply within a business day." },
    ],
  }),
  component: ContactPage,
});

const channels = [
  { icon: Mail, title: "Email", value: "hello@jOBiON.dev", hint: "Replies within one business day." },
  { icon: MessageCircle, title: "Discord", value: "discord.gg/jOBiON", hint: "Live chat with the team and community." },
  { icon: MapPin, title: "HQ", value: "Remote-first · San Francisco", hint: "We hire across NA & EU time zones." },
];

function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="container-page pt-24 pb-12">
          <motion.div initial="hidden" whileInView="show" viewport={viewportOnce} variants={revealStagger} className="max-w-2xl">
            <motion.p variants={reveal} className="eyebrow">Contact</motion.p>
            <motion.h1 variants={reveal} className="h-display mt-4 text-display md:text-display">Let's talk.</motion.h1>
            <motion.p variants={reveal} className="mt-5 text-body-lg text-secondary">
              Pitching a partnership, reporting a bug, or telling us a job listing sucks — we want to hear it.
            </motion.p>
          </motion.div>
        </section>

        <section className="container-page pb-20">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
            <motion.form
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
              variants={reveal}
              onSubmit={(e) => { e.preventDefault(); setSent(true); }}
              className="rounded-lg border border-border bg-card p-8"
            >
              <div className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" required placeholder="Ada Lovelace" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required placeholder="ada@example.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input id="topic" placeholder="Partnership, bug, feedback…" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" required rows={6} placeholder="Tell us what's on your mind." />
                </div>
                <Button type="submit" size="lg" className="mt-2 w-full rounded-full" disabled={sent}>
                  {sent ? (<><Check className="mr-2 h-4 w-4" />Message sent</>) : (<>Send message<Send className="ml-2 h-4 w-4" /></>)}
                </Button>
              </div>
            </motion.form>

            <motion.div initial="hidden" whileInView="show" viewport={viewportOnce} variants={revealStagger} className="space-y-4">
              {channels.map((c) => (
                <motion.div key={c.title} variants={reveal} className="rounded-lg border border-border bg-card p-6">
                  <div className="flex items-start gap-4">
                    <div className="grid h-10 w-10 place-items-center rounded-md bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 text-white">
                      <c.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-small font-heading">{c.title}</div>
                      <div className="mt-1 text-small">{c.value}</div>
                      <div className="mt-1 text-micro text-secondary">{c.hint}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
