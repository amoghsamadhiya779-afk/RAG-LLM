import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { api } from "@/services/api";

export const Route = createFileRoute("/companies/")({
  head: () => ({ meta: [{ title: "Companies hiring on jOBiON" }] }),
  component: CompaniesIndex,
});

function CompaniesIndex() {
  const { data: companies = [], isLoading } = useQuery({ queryKey: ["companies"], queryFn: () => api.companies.list() });
  return (
    <div className="min-h-dvh flex flex-col">
      <SiteHeader />
      <main className="flex-1 container-page py-10">
        <h1 className="font-display text-h2 font-display">Companies hiring</h1>
        <p className="mt-1 text-small text-secondary">{companies.length} teams shipping with jOBiON.</p>

        {isLoading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass-card h-32 animate-pulse" />)}</div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to="/companies/$id" params={{ id: c.slug }} className="glass-card block p-5 transition-colors hover:border-primary/40">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-lg border border-border bg-surface-elevated font-heading">
                      {c.name[0]}
                    </div>
                    <div>
                      <h3 className="font-display text-body-lg font-heading">{c.name}</h3>
                      <p className="text-micro text-secondary">{c.location ?? "Remote"}</p>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-small text-secondary">{c.about}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
