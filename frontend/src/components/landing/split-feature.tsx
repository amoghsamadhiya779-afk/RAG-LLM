import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { reveal, revealStagger, viewportOnce } from "@/lib/motion";

export function SplitFeature({
 eyebrow,
 title,
 body,
 bullets,
 ctaLabel,
 ctaTo,
 visual,
 reverse,
}: {
 eyebrow: string;
 title: string;
 body: string;
 bullets: string[];
 ctaLabel: string;
 ctaTo: string;
 visual: ReactNode;
 reverse?: boolean;
}) {
 return (
  <section className="py-24 sm:py-28">
   <div className="container-page">
    <motion.div
     variants={revealStagger}
     initial="hidden"
     whileInView="show"
     viewport={viewportOnce}
     className={`grid items-center gap-12 lg:grid-cols-2 lg:gap-20 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}
    >
     <motion.div variants={reveal}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="h-section mt-3 text-h1 sm:text-display">{title}</h2>
      <p className="mt-5 text-body leading-relaxed text-secondary sm:text-body-lg">{body}</p>
      <ul className="mt-7 space-y-3">
       {bullets.map((b) => (
        <li key={b} className="flex gap-3 text-small">
         <span className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-accent" />
         <span className="text-foreground">{b}</span>
        </li>
       ))}
      </ul>
      <Link
       to={ctaTo}
       className="group mt-8 inline-flex items-center gap-1.5 text-small font-ui text-foreground"
      >
       {ctaLabel}
       <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
     </motion.div>

     <motion.div variants={reveal} className="relative">
      <div className="rounded-lg border border-border bg-card p-3 -lift">
       {visual}
      </div>
      <div aria-hidden className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-accent opacity-[0.08] blur-2xl" />
     </motion.div>
    </motion.div>
   </div>
  </section>
 );
}
