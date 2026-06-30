import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Globe, MapPin, Users } from "lucide-react";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { JobCard } from "@/components/site/job-card";
import { api } from "@/services/api";
import type { Job, JobWithCompany } from "@/types";

export const Route = createFileRoute("/companies/$id")({
  loader: async ({ params }) => {
    const res = await api.companies.get(params.id);
    if (!res) throw notFound();
    return res;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.company.name} — Hiring on jOBiON` : "Company" },
      { name: "description", content: loaderData?.company.about.slice(0, 160) },
      { property: "og:title", content: loaderData?.company.name },
      { property: "og:description", content: loaderData?.company.about.slice(0, 160) },
    ],
  }),
  component: CompanyPage,
});

function CompanyPage() {
  const { company, jobs } = Route.useLoaderData();
  const withCompany: JobWithCompany[] = jobs.map((j: Job) => ({ ...j, company }));

  return (
    <div className="min-h-dvh flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="pointer-events-none absolute -top-20 left-1/3 h-[400px] w-[700px] rounded-full bg-primary/10 blur-[100px]" />
          <div className="container-page relative py-16">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-6">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-border bg-surface text-2xl font-semibold">
                {company.name[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-4xl font-bold">{company.name}</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">{company.about}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {company.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{company.location}</span>}
                  {company.size && <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{company.size}</span>}
                  {company.website && <a href={company.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground"><Globe className="h-3 w-3" />{company.website.replace(/^https?:\/\//, "")}</a>}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="container-page py-12">
          <h2 className="font-display text-2xl font-semibold">Open roles ({withCompany.length})</h2>
          {withCompany.length === 0 ? (
            <div className="mt-6 glass-card p-10 text-center text-muted-foreground">
              No open roles right now. <Link to="/jobs" className="underline">Browse other companies</Link>.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {withCompany.map((j) => <JobCard key={j.id} job={j} />)}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
