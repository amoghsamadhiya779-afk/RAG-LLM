"use client";

import { SiteHeader } from "@/components/site/header";
import { Hero } from "@/components/landing/hero";
import { Search, Sparkles, FileText, Bot, Compass, Briefcase } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-void text-bone font-sans">
      <SiteHeader />
      <main>
        <Hero />
        
        {/* Features Section */}
        <section id="features" className="container-page py-24 sm:py-32">
          <div className="mb-16">
            <h2 className="font-geist text-[32px] font-semibold text-paper">
              Search that actually<br />understands you.
            </h2>
            <p className="mt-4 text-[18px] text-mist max-w-xl">
              Forget keyword roulette. We read job descriptions the way you read them — and rank them by what you've actually shipped.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Search, title: "Semantic search", desc: "Ask in plain English — 'remote senior react roles on AI teams' — and get ranked results." },
              { icon: Sparkles, title: "AI matching", desc: "Jobs ranked to your resume by skill overlap and seniority alignment." },
              { icon: FileText, title: "Instant parsing", desc: "Upload a PDF or DOCX — we extract skills, experience, and education in seconds." },
            ].map((f, i) => (
              <div key={i} className="glass-card">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-iron border border-bone/10">
                  <f.icon className="h-5 w-5 text-bone" />
                </div>
                <h3 className="font-geist text-[24px] font-medium text-paper mb-2">{f.title}</h3>
                <p className="text-[16px] text-mist leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Use Cases Section */}
        <section id="use-cases" className="relative border-t border-bone/[0.06] py-24 sm:py-32 bg-char/30">
          <div className="container-page">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="font-geist text-[32px] font-semibold text-paper mb-6">
                  From search to offer.
                </h2>
                <p className="text-[18px] text-mist mb-8">
                  Type what you want in plain English. We turn your query into a ranked feed of roles, pre-scored against your resume — then route you to one-click apply.
                </p>
                <div className="space-y-4">
                  {[
                    "Natural-language search across every live role",
                    "Match score visible before you click apply",
                    "Resume parsed once, reused everywhere"
                  ].map((bullet, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border border-bone/20 bg-void">
                        <span className="text-[12px] text-bone font-medium">{i + 1}</span>
                      </div>
                      <span className="text-[16px] text-bone">{bullet}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-10">
                  <Link href="/jobs">
                    <Button className="rounded-pill bg-paper text-void px-6 hover:bg-paper/90">
                      Try the search
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="glass-card relative aspect-square overflow-hidden bg-void/50 flex items-center justify-center p-8">
                <div className="absolute inset-0 bg-radial-indigo opacity-20" />
                <div className="relative z-10 w-full rounded-2xl border border-bone/10 bg-char p-6 shadow-2xl">
                   <div className="flex items-center gap-4 border-b border-bone/10 pb-4">
                     <div className="h-10 w-10 rounded-lg bg-void border border-bone/10 flex items-center justify-center">
                       <Bot className="h-5 w-5 text-bone" />
                     </div>
                     <div>
                       <h4 className="font-geist font-medium text-paper text-[16px]">AI Assistant</h4>
                       <p className="text-[14px] text-mist">Reviewing your matches...</p>
                     </div>
                   </div>
                   <div className="mt-4 space-y-3">
                     <div className="h-8 rounded-pill bg-iron/50 w-3/4" />
                     <div className="h-8 rounded-pill bg-iron/50 w-1/2" />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing / CTA Section */}
        <section id="pricing" className="container-page py-24 sm:py-32 border-t border-bone/[0.06]">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-sans text-[48px] tracking-[-0.035em] text-paper mb-6">
              Ready to find your match?
            </h2>
            <p className="text-[18px] text-mist mb-10">
              Join thousands of engineers who have already discovered their next career defining role.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/auth">
                <Button className="h-12 rounded-pill bg-paper text-void px-8 text-[16px] hover:bg-paper/90">
                  Get Started
                </Button>
              </Link>
              <Link href="/post">
                <Button variant="outline" className="h-12 rounded-pill px-8 text-[16px]">
                  Post a Job
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      {/* Simple Footer */}
      <footer className="border-t border-bone/[0.06] py-12 text-center">
        <p className="text-[14px] text-fog">© {new Date().getFullYear()} Dimension. All rights reserved.</p>
      </footer>
    </div>
  );
}
