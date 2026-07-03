import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Search, Sparkles, FileText, Zap } from "lucide-react";
import { reveal, revealStagger } from "@/lib/motion";
import { GalaxyBackground } from "@/components/landing/GalaxyBackground";

export function Hero() {
 return (
  <section className="relative overflow-hidden pt-24 pb-28 sm:pt-32 sm:pb-40">
   {/* Dimension Gradient Backdrop & WebGL Galaxy */}
   <GalaxyBackground />
   <div aria-hidden className="absolute inset-0 -z-20 bg-dawn-wash" />
   <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(120,119,198,0.15),transparent)]" />
   
   {/* Bottom fade to void */}
   <div aria-hidden className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-void" />

   <motion.div
    variants={revealStagger}
    initial="hidden"
    animate="show"
    className="container-page relative z-10 grid gap-16 lg:grid-cols-12 lg:gap-8"
   >
    {/* Left Column: Text & Features (approx 40%) */}
    <div className="lg:col-span-5 lg:pr-8 flex flex-col justify-center">
     <motion.div variants={reveal}>
      <p className="mb-4 text-[15px] font-ui text-bone">
       Introducing jOBiON
      </p>
     </motion.div>

     <motion.h1
      variants={reveal}
      className="font-sans text-[56px] leading-[1.05] tracking-[-0.035em] text-paper sm:text-[72px] sm:leading-[1]"
     >
      Find your next<br />role in tech.
     </motion.h1>

     <motion.div variants={reveal} className="mt-10 space-y-2">
      {[
       { icon: Search, text: "Natural-language semantic job search" },
       { icon: Sparkles, text: "AI matching tailored to your exact skills" },
       { icon: FileText, text: "Instant resume parsing in seconds" },
       { icon: Zap, text: "One-click apply to your perfect roles" },
      ].map((f, i) => (
       <div key={i} className="flex items-center gap-3 h-8">
        <f.icon className="h-[14px] w-[14px] text-ash stroke-[1.5]" />
        <span className="text-[15px] text-mist">{f.text}</span>
       </div>
      ))}
     </motion.div>

     <motion.div variants={reveal} className="mt-10">
      <Link
       href="#jobs"
       className="inline-flex h-10 items-center justify-center gap-2 rounded-pill bg-paper px-5 text-[15px] font-ui text-void transition-colors hover:bg-paper/90"
      >
       Start Searching
       <ArrowRight className="h-3.5 w-3.5" />
      </Link>
     </motion.div>

     {/* Left Column: Numbered Feature List */}
     <motion.div variants={reveal} className="mt-16 max-w-sm">
      <h3 className="mb-4 text-[16px] font-ui text-bone">What jOBiON handles for you</h3>
      <div className="flex flex-col gap-2">
       {[
        { label: "Semantic Search", active: true },
        { label: "Resume Parsing", active: false },
        { label: "AI Matching", active: false },
        { label: "Application Tracking", active: false },
       ].map((item, i) => (
        <div key={i} className="flex h-10 items-center justify-between border-t border-bone/[0.06]">
         <span className={`text-[16px] ${item.active ? "text-bone" : "text-mist"}`}>{item.label}</span>
         <span className="text-[14px] font-ui text-fog">0{i + 1}</span>
        </div>
       ))}
      </div>
     </motion.div>
    </div>

    {/* Right Column: Mockup (approx 60%) */}
    <div className="lg:col-span-7">
     <motion.div variants={reveal} className="relative w-full h-full min-h-[500px]">
      {/* The Glass Product Mockup */}
      <div className="glass-card absolute inset-0 overflow-hidden flex flex-col p-8 lg:p-12">
       <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-bone/10 bg-iron/40 px-3 py-1.5 backdrop-blur-md">
         <span className="h-1.5 w-1.5 rounded-full bg-indigo-haze/80" />
         <span className="text-[13px] text-bone">Matching your profile <span className="text-mist">with live roles →</span></span>
        </div>
       </div>
       
       <h2 className="text-[32px] font-ui text-paper">Semantic Search</h2>
       <p className="mt-2 text-[16px] text-mist max-w-lg">
        jOBiON indexes the world's tech jobs. Just type what you want in plain English, and the AI will rank roles against your parsed resume.
       </p>

       {/* Fake Search Results / Dock */}
       <div className="mt-16 flex flex-col gap-3">
        {[
         { title: "Senior React Engineer", company: "Vercel", match: "98" },
         { title: "Frontend Developer", company: "Linear", match: "92" },
         { title: "Full Stack Engineer", company: "Stripe", match: "87" },
        ].map((job, i) => (
         <div key={i} className="flex h-16 items-center justify-between rounded-lg bg-ink/60 p-4 backdrop-blur-lg border border-bone/[0.04]">
          <div>
           <h4 className="font-geist text-[15px] font-ui text-bone">{job.title}</h4>
           <p className="text-[13px] text-mist">{job.company}</p>
          </div>
          <span className="flex h-8 items-center justify-center rounded-pill bg-indigo-haze/20 px-3 text-[13px] font-display text-bone ">
           <Sparkles className="mr-1.5 h-3 w-3" />
           {job.match}% Match
          </span>
         </div>
        ))}
       </div>
      </div>
     </motion.div>
    </div>
   </motion.div>
  </section>
 );
}
