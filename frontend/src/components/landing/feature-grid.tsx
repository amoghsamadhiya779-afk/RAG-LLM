import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { reveal, revealStagger, viewportOnce } from "@/lib/motion";
import { Link } from "@tanstack/react-router";
export type Feature = {
 icon: LucideIcon;
 title: string;
 description: string;
 href?: string;
};

export function FeatureGrid({
 eyebrow,
 title,
 subhead,
 features,
}: {
 eyebrow: string;
 title: string;
 subhead: string;
 features: Feature[];
}) {
 return (
  <section className="py-24 sm:py-32">
   <div className="container-page">
    <motion.div
     variants={revealStagger}
     initial="hidden"
     whileInView="show"
     viewport={viewportOnce}
     className="mx-auto max-w-2xl text-center"
    >
     <motion.p variants={reveal} className="eyebrow">{eyebrow}</motion.p>
     <motion.h2 variants={reveal} className="h-section mt-3 text-h1 sm:text-display">
      {title}
     </motion.h2>
     <motion.p variants={reveal} className="mt-5 text-body leading-relaxed text-secondary sm:text-body-lg">
      {subhead}
     </motion.p>
    </motion.div>

    <motion.div
     variants={revealStagger}
     initial="hidden"
     whileInView="show"
     viewport={viewportOnce}
     className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
    >
     {features.map((f) => {
      const Card = (
       <motion.div
        key={f.title}
        variants={reveal}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="group flex h-full flex-col rounded-lg border border-border bg-card p-6 -soft transition- hover:-lift hover:border-primary/40 cursor-pointer"
       >
        <span className="grid h-10 w-10 place-items-center rounded-md border border-border bg-muted text-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/30">
         <f.icon className="h-4 w-4" />
        </span>
        <h3 className="mt-5 text-body font-heading tracking-tight">{f.title}</h3>
        <p className="mt-2 text-small leading-relaxed text-secondary">{f.description}</p>
       </motion.div>
      );
      return f.href ? <Link href={f.href} key={f.title} className="block">{Card}</Link> : <div key={f.title}>{Card}</div>;
     })}
    </motion.div>
   </div>
  </section>
 );
}
