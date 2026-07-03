import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { Search, Sparkles, FileText, Zap, MessagesSquare, Compass, GitBranch, Bell } from "lucide-react";

export const Route = createFileRoute("/features")({
  component: FeaturesPage,
});

const featuresA = [
  { icon: Search, title: "Semantic search", description: "Ask in plain English — 'remote senior react roles on AI teams' — and get ranked results." },
  { icon: Sparkles, title: "AI matching", description: "Jobs ranked to your resume by skill overlap and seniority alignment." },
  { icon: FileText, title: "Instant resume parsing", description: "Upload a PDF or DOCX — we extract skills, experience, and education in seconds." },
  { icon: Zap, title: "One-click apply", description: "Apply with your parsed profile and a personal note. No retyping, ever." },
];

const featuresB = [
  { icon: MessagesSquare, title: "AI assistant", description: "Chat with the open-roles index. Ask which jobs fit and why." },
  { icon: Compass, title: "Personalized recs", description: "Daily picks ranked to your profile, not someone else's algorithm." },
  { icon: GitBranch, title: "Skill-gap insights", description: "See which skills unlock the next tier of roles you want." },
  { icon: Bell, title: "Smart job alerts", description: "Weekly digests for the exact roles you described, semantically matched." },
];

function FeaturesPage() {
  return (
    <div className="min-h-dvh bg-void text-foreground">
      <SiteHeader />
      <main className="pt-24 pb-16">
        <FeatureGrid
          eyebrow="For candidates"
          title="Search that actually understands you."
          subhead="Forget keyword roulette. jOBiON reads job descriptions the way you read them — and ranks them by what you've actually shipped."
          features={featuresA}
        />
        <FeatureGrid
          eyebrow="AI-native"
          title="AI-native, candidate-first."
          subhead="Every surface in jOBiON is designed around one question: does this role fit you, right now?"
          features={featuresB}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
