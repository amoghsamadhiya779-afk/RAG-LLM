import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, Briefcase, Building2, Users, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { api } from "@/services/api";
import { readMockSession } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: () => {
    const s = readMockSession();
    if (s?.profile.role !== "admin") throw redirect({ to: "/" });
  },
  head: () => ({ meta: [{ title: "Admin — jOBiON" }] }),
  component: AdminPage,
});

function AdminPage() {
  const qc = useQueryClient();
  const { data: pending = [], isLoading } = useQuery({ queryKey: ["admin", "pending"], queryFn: () => api.admin.pendingJobs() });
  const { data: stats } = useQuery({ queryKey: ["admin", "stats"], queryFn: () => api.admin.stats() });

  const moderate = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "live" | "rejected" }) => api.admin.setStatus(id, status),
    onSuccess: (_d, v) => {
      toast.success(v.status === "live" ? "Approved" : "Rejected");
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  return (
    <div className="min-h-dvh flex flex-col">
      <SiteHeader />
      <main className="flex-1 container-page py-10">
        <h1 className="font-display text-3xl font-bold">Admin</h1>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile icon={Briefcase} label="Live jobs" value={stats?.live ?? 0} />
          <StatTile icon={FileCheck} label="Pending" value={stats?.pending ?? 0} />
          <StatTile icon={Users} label="Applications" value={stats?.applications ?? 0} />
          <StatTile icon={Building2} label="Companies" value={stats?.companies ?? 0} />
        </div>

        <h2 className="mt-10 font-display text-xl font-semibold">Pending moderation</h2>
        {isLoading ? (
          <div className="mt-4 space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="glass-card h-24 animate-pulse" />)}</div>
        ) : pending.length === 0 ? (
          <div className="mt-4 glass-card p-10 text-center text-muted-foreground">Nothing pending. Inbox zero ✨</div>
        ) : (
          <ul className="mt-4 space-y-3">
            {pending.map((j) => (
              <li key={j.id} className="glass-card flex items-start justify-between gap-4 p-4">
                <div className="min-w-0">
                  <h3 className="font-medium">{j.title}</h3>
                  <p className="text-xs text-muted-foreground">{j.company.name} · {j.location ?? "Remote"}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{j.description}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={() => moderate.mutate({ id: j.id, status: "rejected" })}><X className="h-4 w-4" /> Reject</Button>
                  <Button size="sm" onClick={() => moderate.mutate({ id: j.id, status: "live" })}><Check className="h-4 w-4" /> Approve</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: typeof Briefcase; label: string; value: number }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}
