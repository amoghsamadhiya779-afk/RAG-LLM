"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "@/services/api";

export default function CompaniesSection({ className }: { className?: string }) {
  const { data: companiesData = [], isLoading } = useQuery({ 
    queryKey: ["companies"], 
    queryFn: () => api.companies.list() 
  });
  
  // Fallback to top companies if database is empty
  const companies = companiesData.length > 0 ? companiesData : [
    { id: "1", slug: "google", name: "Google", location: "Mountain View, CA", about: "Organizing the world's information and making it universally accessible and useful." },
    { id: "2", slug: "openai", name: "OpenAI", location: "San Francisco, CA", about: "Ensuring that artificial general intelligence benefits all of humanity." },
    { id: "3", slug: "vercel", name: "Vercel", location: "Remote", about: "Developing the frontend cloud. Creators of Next.js." },
    { id: "4", slug: "stripe", name: "Stripe", location: "San Francisco / Remote", about: "Financial infrastructure platform for the internet." },
    { id: "5", slug: "anthropic", name: "Anthropic", location: "San Francisco, CA", about: "An AI safety and research company building reliable, interpretable, and steerable AI systems." },
    { id: "6", slug: "linear", name: "Linear", location: "Remote", about: "The modern software development standard. Streamline issues, projects, and product roadmaps." }
  ] as any[];
  
  return (
    <section id="companies" className={`relative py-24 sm:py-32 border-t border-bone/[0.06] ${className || ""}`}>
      <div className="container-page">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-display font-bold tracking-tight sm:text-5xl">
            Companies <span className="text-gradient-accent">Hiring</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {companiesData.length > 0 ? `${companiesData.length} teams shipping with jOBiON.` : "Discover top teams hiring in tech."}
          </p>
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass-card h-32 animate-pulse" />)}
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((c: any, i: number) => (
              <div 
                key={c.id} 
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <Link href={`/companies/${c.slug || c.id}`} className="block p-6 rounded-2xl bg-[#1d1d1d]/80 backdrop-blur-md border border-[#e5e5e5]/10 shadow-2xl transition-colors hover:border-[#6b62f2]/50">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-xl border border-[#e5e5e5]/10 bg-[#3d3d3d]/50 text-white font-semibold shadow-inner">
                      {c.name[0]}
                    </div>
                    <div>
                      <h3 className="font-geist text-[17px] font-semibold text-white">{c.name}</h3>
                      <p className="text-[13px] text-[#b2b2b2]">{c.location ?? "Remote"}</p>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-[14px] text-[#797979] leading-relaxed">{c.about}</p>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
