import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { ShrinkNavbar } from "@/components/fx";
import { PixelHero } from "@/components/ui/pixel-perfect-hero";

import { listJobs } from "@/lib/api/jobs";

// Below-the-fold sections load in parallel with hero paint. Each Suspense
// fallback holds a fixed height to prevent layout shift as chunks resolve.
const LogoMarquee = lazy(() =>
  import("@/components/landing/LogoMarquee").then((m) => ({ default: m.LogoMarquee })),
);
const HowItWorks = lazy(() =>
  import("@/components/landing/HowItWorks").then((m) => ({ default: m.HowItWorks })),
);
const FeaturedJobs = lazy(() =>
  import("@/components/landing/FeaturedJobs").then((m) => ({ default: m.FeaturedJobs })),
);
const StatsBand = lazy(() =>
  import("@/components/landing/StatsBand").then((m) => ({ default: m.StatsBand })),
);
const AntigravitySection = lazy(() =>
  import("@/components/landing/AntigravitySection").then((m) => ({
    default: m.AntigravitySection,
  })),
);
const Testimonials = lazy(() =>
  import("@/components/landing/Testimonials").then((m) => ({ default: m.Testimonials })),
);
const PricingTeaser = lazy(() =>
  import("@/components/landing/PricingTeaser").then((m) => ({ default: m.PricingTeaser })),
);
const Footer = lazy(() =>
  import("@/components/landing/Footer").then((m) => ({ default: m.Footer })),
);

// Shared by loader (prime) + FeaturedJobs component (subscribe). Must stay
// keyed identically to whatever FeaturedJobs consumes.
export const featuredJobsQueryOptions = queryOptions({
  queryKey: ["jobs", "featured"],
  queryFn: () => listJobs({ page: 1, page_size: 6 }),
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

// Fixed-height section fallback: absorbs the lazy-chunk gap without CLS.
function SectionSkeleton({ h = "h-[600px]" }: { h?: string }) {
  return <div aria-hidden className={`${h} w-full`} />;
}

import { GalaxyBackground } from "@/components/landing/GalaxyBackground";

function LandingPage() {
  return (
    <div className="min-h-screen bg-transparent text-foreground">
      <ShrinkNavbar />
      <main>
        <PixelHero />
        <Suspense fallback={<SectionSkeleton h="h-24" />}>
          <LogoMarquee />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <HowItWorks />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <FeaturedJobs />
        </Suspense>
        <Suspense fallback={<SectionSkeleton h="h-[400px]" />}>
          <StatsBand />
        </Suspense>
        <Suspense fallback={<SectionSkeleton h="h-[700px]" />}>
          <AntigravitySection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <Testimonials />
        </Suspense>
        <Suspense fallback={<SectionSkeleton h="h-[400px]" />}>
          <PricingTeaser />
        </Suspense>
      </main>
      <Suspense fallback={<SectionSkeleton h="h-64" />}>
        <Footer />
      </Suspense>
    </div>
  );
}
