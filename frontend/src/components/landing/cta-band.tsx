import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reveal, revealStagger, viewportOnce } from "@/lib/motion";

export function CtaBand() {
 return (
  <section className="py-24 sm:py-32">
   <div className="container-page">
    <motion.div
     variants={revealStagger}
     initial="hidden"
     whileInView="show"
     viewport={viewportOnce}
     className="relative overflow-hidden rounded-lg border border-border bg-card px-6 py-20 text-center -soft sm:px-12"
    >
     <div aria-hidden className="absolute inset-0 -z-10 hero-glow opacity-80" />
     <div aria-hidden className="absolute inset-0 -z-10 grid-bg opacity-60" />

     <motion.h2 variants={reveal} className="h-display mx-auto max-w-3xl text-h1 sm:text-display">
      Your next role is one
      <br />
      <span className="text-gradient-accent">search away.</span>
     </motion.h2>
     <motion.p variants={reveal} className="mx-auto mt-5 max-w-lg text-body leading-relaxed text-secondary sm:text-body-lg">
      Join thousands of developers and dozens of hiring teams already on jOBiON.
     </motion.p>
     <motion.div variants={reveal} className="mt-9 flex flex-wrap items-center justify-center gap-3">
      <Link to="/jobs">
       <Button size="lg" className="rounded-full" variant="secondary">
        Browse open roles
       </Button>
      </Link>
      <Link to="/dashboard">
       <Button size="lg" variant="outline" className="h-11 rounded-full border-border bg-transparent px-6 text-small font-ui">
        Post a job
       </Button>
      </Link>
     </motion.div>
    </motion.div>
   </div>
  </section>
 );
}
