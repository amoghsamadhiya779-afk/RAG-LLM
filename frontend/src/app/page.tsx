"use client";

import { SiteHeader } from "@/components/site/header";
import { Hero } from "@/components/landing/hero";
import { LogoMarquee } from "@/components/landing/logo-marquee";
import { SplitFeature } from "@/components/landing/split-feature";
import { MatchVisual } from "@/components/landing/match-visual";
import { PipelineVisual } from "@/components/landing/pipeline-visual";
import { PricingCards } from "@/components/landing/pricing-cards";
import { FAQ } from "@/components/landing/faq";
import JobsSection from "@/components/sections/jobs-section";
import CompaniesSection from "@/components/sections/companies-section";
import AiWorkspaceSection from "@/components/sections/ai-workspace-section";
import { ScrollReveal } from "@/components/animation/scroll-reveal";
import { useHighlightSection } from "@/hooks/use-highlight";

export default function LandingPage() {
  // Activate highlight / smooth scroll on hash matches across all sections
  useHighlightSection();

  return (
    <div className="min-h-dvh bg-void text-bone font-sans">
      <SiteHeader />
      
      <main className="relative z-10 bg-void">
        {/* Hero Section */}
        <Hero />
        
        {/* Brand Trust Section */}
        <LogoMarquee />
        
        {/* Features Split Feature: AI Matching Visual */}
        <div id="features">
          <SplitFeature
            eyebrow="AI Matching"
            title="Search that actually understands you."
            body="Forget keyword roulette. We index the details of your actual project experience and match them to the real needs of engineering teams."
            bullets={[
              "Natural-language search across every live role",
              "Pre-scored match percentages shown instantly",
              "Deep alignment based on tech stack and seniority level"
            ]}
            ctaLabel="Try the search"
            ctaTo="#jobs"
            visual={<MatchVisual />}
          />
        </div>

        {/* Jobs Section */}
        <JobsSection />

        {/* Companies Section */}
        <CompaniesSection />

        {/* Use Cases Split Feature: Application Pipeline Tracking */}
        <div id="use-cases">
          <SplitFeature
            eyebrow="For Employers"
            title="Manage applicants without the chaos."
            body="Receive pre-sorted, high-signal applications matched directly to your role specs. Sync candidates directly back to your ATS."
            bullets={[
              "ATS integration with Greenhouse, Lever, and Workable",
              "Instantly view resume parse data & match insights",
              "Collaborate with your team on a simple applicant pipeline"
            ]}
            ctaLabel="Post a Job"
            ctaTo="/post"
            visual={<PipelineVisual />}
            reverse
          />
        </div>

        {/* AI Workspace Section */}
        <AiWorkspaceSection />

        {/* Pricing Cards Section */}
        <PricingCards />

        {/* FAQ Section */}
        <FAQ />
      </main>
      
      {/* Simple Footer */}
      <ScrollReveal>
        <footer className="border-t border-bone/[0.06] py-12 text-center">
          <p className="text-[14px] text-fog">© {new Date().getFullYear()} Dimension. All rights reserved.</p>
        </footer>
      </ScrollReveal>
    </div>
  );
}
