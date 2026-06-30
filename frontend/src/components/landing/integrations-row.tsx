import { motion } from "framer-motion";
import { reveal, revealStagger, viewportOnce } from "@/lib/motion";

const integrations = ["Slack", "Greenhouse", "Lever", "LinkedIn", "Stripe"];

export function IntegrationsRow() {
  return (
    <section className="py-24">
      <div className="container-page">
        <motion.div
          variants={revealStagger}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.p variants={reveal} className="eyebrow">Integrations</motion.p>
          <motion.h2 variants={reveal} className="h-section mt-3 text-3xl sm:text-4xl">
            Works with your hiring stack.
          </motion.h2>
          <motion.p variants={reveal} className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Plug jOBiON into your ATS, comms, and billing tools. Sync applicants, post jobs, and route candidates without leaving your workflow.
          </motion.p>
        </motion.div>

        <motion.div
          variants={revealStagger}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
        >
          {integrations.map((name) => (
            <motion.div
              key={name}
              variants={reveal}
              className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium tracking-tight text-muted-foreground"
            >
              {name}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
