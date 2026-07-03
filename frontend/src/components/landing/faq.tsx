import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { reveal, revealStagger, viewportOnce } from "@/lib/motion";

const faqs = [
  {
    q: "How is jOBiON different from other job boards?",
    a: "Every listing is ranked by semantic similarity to your resume and your stated preferences — not by keyword stuffing. Employers reach the candidates most likely to fit, and seekers see roles ranked by genuine match, not paid lottery.",
  },
  {
    q: "How does AI matching work?",
    a: "We embed every job description and every uploaded resume with a state-of-the-art language model, then score candidate–role similarity in vector space. Your match percentage reflects skill overlap, seniority alignment, and the specifics of what you've shipped.",
  },
  {
    q: "Is it free for job seekers?",
    a: "Yes. Browsing, applying, resume parsing, AI matching, and weekly smart alerts are free forever for candidates. We only charge employers — and only when they want to amplify a role.",
  },
  {
    q: "Can I integrate my ATS?",
    a: "Enterprise plans include native integrations with Greenhouse, Lever, and Workable. Applicants sync both directions, so you can keep working in your existing tool while sourcing from jOBiON.",
  },
  {
    q: "How do featured listings work?",
    a: "A featured listing pins your job to the top of relevant semantic results for 30 days, adds a Featured badge, and unlocks performance analytics. One flat fee per job, no auctions, no bidding.",
  },
];

export function FAQ() {
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
          <motion.p variants={reveal} className="eyebrow">FAQ</motion.p>
          <motion.h2 variants={reveal} className="h-section mt-3 text-h1 sm:text-display">
            Questions, answered.
          </motion.h2>
        </motion.div>

        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mx-auto mt-12 max-w-3xl"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={f.q}
                value={`item-${i}`}
                className="rounded-lg border border-border bg-card px-6"
              >
                <AccordionTrigger className="py-5 text-left text-body font-ui hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-small leading-relaxed text-secondary">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
