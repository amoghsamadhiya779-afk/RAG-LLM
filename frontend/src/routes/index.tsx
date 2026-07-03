import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  Sparkles,
  FileText,
  Zap,
  MessagesSquare,
  Compass,
  GitBranch,
  Bell,
} from "lucide-react";

import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Hero } from "@/components/landing/hero";
import { GalaxyBackground } from "@/components/landing/GalaxyBackground";
import { LogoMarquee } from "@/components/landing/logo-marquee";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { SplitFeature } from "@/components/landing/split-feature";
import { MatchVisual } from "@/components/landing/match-visual";
import { PipelineVisual } from "@/components/landing/pipeline-visual";
import { IntegrationsRow } from "@/components/landing/integrations-row";
import { PricingCards } from "@/components/landing/pricing-cards";
import { FAQ } from "@/components/landing/faq";
import { CtaBand } from "@/components/landing/cta-band";
import { BrandReveal } from "@/components/animation/brand-reveal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "jOBiON — The AI-native tech job board" },
      {
        name: "description",
        content:
          "Find your next role in tech. Semantic search, AI matching, and instant resume parsing — the modern job board built for developers.",
      },
      { property: "og:title", content: "jOBiON — The AI-native tech job board" },
      { property: "og:description", content: "Search, match, and apply to engineering roles ranked to your resume." },
    ],
  }),
  component: LandingPage,
});

const featuresA = [
  { icon: Search, title: "Semantic search", description: "Ask in plain English — 'remote senior react roles on AI teams' — and get ranked results." },
  { icon: Sparkles, title: "AI matching", description: "Jobs ranked to your resume by skill overlap and seniority alignment." },
  { icon: FileText, title: "Instant resume parsing", description: "Upload a PDF or DOCX — we extract skills, experience, and education in seconds." },
  { icon: Zap, title: "One-click apply", description: "Apply with your parsed profile and a personal note. No retyping, ever." },
];

function LandingPage() {
  return (
    <div className="min-h-dvh bg-void text-foreground relative">
      <BrandReveal />
      <GalaxyBackground />
      <SiteHeader />
      
      <main className="relative z-10">
        <Hero />
        
        <FeatureGrid
          eyebrow="For candidates"
          title="Search that actually understands you."
          subhead="Forget keyword roulette. jOBiON reads job descriptions the way you read them — and ranks them by what you've actually shipped."
          features={featuresA}
        />

        <div id="features">
          <SplitFeature
            eyebrow="Candidate flow"
            title="From search to offer."
            body="Type what you want in plain English. We turn your query into a ranked feed of roles, pre-scored against your resume — then route you to one-click apply."
            bullets={[
              "Natural-language search across every live role",
              "Match score visible before you click apply",
              "Resume parsed once, reused everywhere",
            ]}
            ctaLabel="Try the search"
            ctaTo="/jobs"
            visual={<MatchVisual />}
          />
        </div>

        <div id="use-cases">
          <SplitFeature
            reverse
            eyebrow="For employers"
            title="Post once, reach the right engineers."
            body="Stop drowning in unqualified inbound. jOBiON scores every applicant against the role, surfaces the best fits first, and integrates with your existing ATS."
            bullets={[
              "Applicant ranking out of the box",
              "Kanban pipeline with stage automation",
              "Featured listings for high-priority roles",
            ]}
            ctaLabel="Post a job"
            ctaTo="/post"
            visual={<PipelineVisual />}
          />
        </div>

        <LogoMarquee />
        <IntegrationsRow />
        <PricingCards />
        <FAQ />
        <CtaBand />
      </main>
      <SiteFooter />
    </div>
  );
}
