import { GuestBanner } from "@/components/auth/GuestBanner";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";

import { ShrinkNavbar } from "@/components/fx/ShrinkNavbar";
import { Reveal } from "@/components/ui-ext/motion";
import { GradientText } from "@/components/ui-ext/GradientText";
import { BackButton } from "@/components/layout/BackButton";
import { Footer } from "@/components/landing/Footer";
import { EmptyState } from "@/components/ui-ext/EmptyState";
import { QueryBoundary } from "@/components/ui-ext/QueryBoundary";
import { JobCard } from "@/components/jobs/JobCard";
import { listSavedJobs } from "@/lib/api/jobs";

const savedQO = queryOptions({
  queryKey: ["jobs", "saved"],
  queryFn: listSavedJobs,
});

export const Route = createFileRoute("/saved")({
  staticData: { transition: "fadeRise" },
  head: () => ({
    meta: [
      { title: "Saved jobs — jOBiON" },
      { name: "description", content: "Jobs you've bookmarked for later." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(savedQO),
  component: SavedPage,
});

function SavedPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ShrinkNavbar />
      <main className="mx-auto max-w-6xl px-6 pt-32 pb-24">
        <GuestBanner />
        <BackButton fallback="/" className="mb-6" />
        <Reveal>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground font-mono">
            Bookmarked
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            Your <GradientText>saved jobs</GradientText>
          </h1>
        </Reveal>

        <div className="mt-10">
          <QueryBoundary>
            <SavedList />
          </QueryBoundary>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function SavedList() {
  const { data } = useSuspenseQuery(savedQO);
  if (!data.items.length) {
    return (
      <EmptyState
        icon={<Bookmark className="h-8 w-8" />}
        title="No saved jobs yet"
        description="Tap the heart on any job to save it here for later."
      />
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data.items.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
