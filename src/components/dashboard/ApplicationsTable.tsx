import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "@/lib/date";
import type { Application, ApplicationStatus } from "@/lib/api/types";
import { EmptyState } from "@/components/ui-ext/EmptyState";
import { FileText } from "lucide-react";

const statusStyles: Record<ApplicationStatus, string> = {
  submitted: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  in_review: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  interview: "bg-primary/20 text-primary",
  rejected: "bg-rose-500/10 text-rose-500",
  hired: "bg-emerald-500/10 text-emerald-500",
};
const statusLabel: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  in_review: "In review",
  interview: "Interview",
  rejected: "Rejected",
  hired: "Hired",
};

export function ApplicationsTable({ applications }: { applications: Application[] }) {
  if (!applications.length) {
    return (
      <EmptyState
        icon={<FileText className="h-6 w-6" />}
        title="No applications yet"
        description="Apply to a role and it'll show up here."
        action={
          <Link to="/jobs" className="text-sm font-medium underline underline-offset-4">
            Browse jobs
          </Link>
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <th className="text-left font-medium px-4 py-3">Role</th>
            <th className="text-left font-medium px-4 py-3">Company</th>
            <th className="text-left font-medium px-4 py-3">Status</th>
            <th className="text-left font-medium px-4 py-3">Applied</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((a) => (
            <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3">
                <Link to="/jobs/$id" params={{ id: a.job.id }} className="font-medium hover:underline underline-offset-4">
                  {a.job.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{a.job.company.name}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[a.status]}`}>
                  {statusLabel[a.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{formatDistanceToNow(a.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
