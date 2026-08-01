import { lazy, Suspense } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { ShrinkNavbar } from "@/components/fx";
import { PixelHero } from "@/components/ui/pixel-perfect-hero";

import { listJobs } from "@/lib/api/jobs";

import { LogoMarquee } from "@/components/landing/LogoMarquee";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeaturedJobs } from "@/components/landing/FeaturedJobs";
import { StatsBand } from "@/components/landing/StatsBand";
import { AntigravitySection } from "@/components/landing/AntigravitySection";
import { Testimonials } from "@/components/landing/Testimonials";
import { PricingTeaser } from "@/components/landing/PricingTeaser";
import { Footer } from "@/components/landing/Footer";

// Shared by loader (prime) + FeaturedJobs component (subscribe). Must stay
// keyed identically to whatever FeaturedJobs consumes.
export const featuredJobsQueryOptions = queryOptions({
  queryKey: ["jobs", "featured"],
  queryFn: () => listJobs({ page: 1, limit: 6 }),
  staleTime: 60_000,
});

export const Route = createFileRoute("/")({
  staticData: { transition: "fadeRise" },
  head: () => ({
    meta: [
      { title: "jOBiON — AI-powered tech job board with ATS scoring" },
      {
        name: "description",
        content:
          "Curated tech jobs, AI resume rewrites, and ATS scoring so recruiters' bots actually see you. Free forever plan.",
      },
      { property: "og:title", content: "jOBiON — Get hired, not filtered" },
      {
        property: "og:description",
        content:
          "Premium tech jobs · AI resume analysis · ATS scoring. Built for engineers, designers, and PMs.",
      },
    ],
  }),
  // Kick off the featured-jobs fetch during route resolution — parallel with
  // HTML parse — instead of after the client mounts the FeaturedJobs chunk.
  // Non-blocking (no await) so the hero paints without waiting on API.
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(featuredJobsQueryOptions);
  },
  component: LandingPage,
});

import { GalaxyBackground } from "@/components/landing/GalaxyBackground";

function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-transparent text-foreground">
      <ShrinkNavbar />
      <main>
        <PixelHero onPrimaryClick={() => navigate({ to: "/dashboard/resume" })} />
        <LogoMarquee />
        <HowItWorks />
        <FeaturedJobs />
        <StatsBand />
        <AntigravitySection />
        <Testimonials />
        <PricingTeaser />
      </main>
      <Footer />
    </div>
  );
}
