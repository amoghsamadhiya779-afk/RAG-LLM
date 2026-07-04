import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reveal, revealStagger, viewportOnce } from "@/lib/motion";

type Tier = {
 name: string;
 price: string;
 period?: string;
 description: string;
 features: string[];
 cta: { label: string; to?: string; href?: string };
 highlighted?: boolean;
};

const tiers: Tier[] = [
 {
  name: "Free",
  price: "$0",
  period: "forever",
  description: "For early hires and indie companies.",
  features: ["1 active job posting", "Basic listing", "Applicant inbox", "Standard search visibility"],
  cta: { label: "Get started", to: "/dashboard" },
 },
 {
  name: "Featured",
  price: "$29",
  period: "per job",
  description: "Boost visibility for roles that need to fill fast.",
  features: ["Highlighted placement", "30-day visibility boost", "Top of semantic results", "Performance analytics", "Featured badge"],
  cta: { label: "Feature a job", to: "/dashboard" },
  highlighted: true,
 },
 {
  name: "Enterprise",
  price: "Custom",
  description: "Unlimited postings, ATS integration, dedicated support.",
  features: ["Unlimited active jobs", "ATS integration (Greenhouse, Lever)", "SSO & role-based access", "Custom branded company page", "Dedicated success manager"],
  cta: { label: "Schedule demo", href: "mailto:sales@jOBiON.dev" },
 },
];

export function PricingCards() {
 return (
  <section id="pricing" className="py-24 sm:py-32">
   <div className="container-page">
    <motion.div
     variants={revealStagger}
     initial="hidden"
     whileInView="show"
     viewport={viewportOnce}
     className="mx-auto max-w-2xl text-center"
    >
     <motion.p variants={reveal} className="eyebrow">Pricing</motion.p>
     <motion.h2 variants={reveal} className="h-section mt-3 text-h1 sm:text-display">
      Simple pricing for every team.
     </motion.h2>
     <motion.p variants={reveal} className="mt-5 text-body leading-relaxed text-secondary sm:text-body-lg">
      Free for job seekers. Pay only when you want to amplify a role.
     </motion.p>
    </motion.div>

    <motion.div
     variants={revealStagger}
     initial="hidden"
     whileInView="show"
     viewport={viewportOnce}
     className="mt-14 grid gap-5 lg:grid-cols-3"
    >
     {tiers.map((t) => (
      <motion.div
       key={t.name}
       variants={reveal}
       className={`relative flex flex-col rounded-lg border p-7 ${
        t.highlighted
         ? "border-transparent bg-card -lift lg:-mt-4 lg:mb-[-1rem]"
         : "border-border bg-card -soft"
       }`}
       style={
        t.highlighted
         ? {
           backgroundImage:
            "linear-gradient(var(--color-card), var(--color-card)), linear-gradient(135deg, var(--primary), var(--primary))",
           backgroundOrigin: "border-box",
           backgroundClip: "padding-box, border-box",
           border: "1.5px solid transparent",
          }
         : undefined
       }
      >
       {t.highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[11px] font-heading uppercase tracking-wider text-white -lift">
         Popular
        </span>
       )}

       <div className="text-small font-heading tracking-tight">{t.name}</div>
       <p className="mt-1 text-small text-secondary">{t.description}</p>

       <div className="mt-6 flex items-baseline gap-1.5">
        <span className="text-h1 font-heading tracking-tight">{t.price}</span>
        {t.period && <span className="text-small text-secondary">/ {t.period}</span>}
       </div>

       <ul className="mt-6 space-y-2.5 text-small">
        {t.features.map((f) => (
         <li key={f} className="flex items-start gap-2.5 text-foreground">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
          <span className="leading-relaxed">{f}</span>
         </li>
        ))}
       </ul>

       <div className="mt-8 pt-2">
        {t.cta.to ? (
         <Link to={t.cta.to}>
          <Button
           className={`w-full rounded-full ${t.highlighted ? "" : "bg-foreground text-background hover:bg-foreground/90"}`}
           variant={t.highlighted ? "default" : "default"}
          >
           {t.cta.label}
          </Button>
         </Link>
        ) : (
         <a href={t.cta.href}>
          <Button variant="outline" className="w-full rounded-full border-border bg-transparent">
           {t.cta.label}
          </Button>
         </a>
        )}
       </div>
      </motion.div>
     ))}
    </motion.div>
   </div>
  </section>
 );
}
