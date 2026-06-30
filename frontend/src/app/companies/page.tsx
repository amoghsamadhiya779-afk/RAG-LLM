"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "@/services/api";

export default function CompaniesIndex() {
  const { data: companies = [], isLoading } = useQuery({ 
    queryKey: ["companies"], 
    queryFn: () => api.companies.list() 
  });
  
  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-bold">Companies hiring</h1>
      <p className="mt-1 text-sm text-muted-foreground">{companies.length} teams shipping with jOBiON.</p>

      {isLoading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass-card h-32 animate-pulse" />)}
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
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
  );
}
