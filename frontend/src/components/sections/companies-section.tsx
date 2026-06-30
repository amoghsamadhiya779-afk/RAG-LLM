"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "@/services/api";

export default function CompaniesSection({ className }: { className?: string }) {
  const { data: companies = [], isLoading } = useQuery({ 
    queryKey: ["companies"], 
    queryFn: () => api.companies.list() 
  });
  
  return (
    <section id="companies" className={`relative py-24 sm:py-32 border-t border-bone/[0.06] ${className || ""}`}>
      <div className="container-page">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-display font-bold tracking-tight sm:text-5xl">
            Companies <span className="text-gradient-accent">Hiring</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {companies.length > 0 ? `${companies.length} teams shipping with jOBiON.` : "Discover top teams hiring in tech."}
          </p>
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass-card h-32 animate-pulse" />)}
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((c, i) => (
              <motion.div 
                key={c.id} 
                initial={{ opacity: 0, y: 8 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/companies/${c.slug || c.id}`} className="glass-card block p-5 transition-colors hover:border-primary/40">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-lg border border-border bg-surface-elevated font-semibold">
                      {c.name[0]}
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold">{c.name}</h3>
                      <p className="text-xs text-muted-foreground">{c.location ?? "Remote"}</p>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{c.about}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
