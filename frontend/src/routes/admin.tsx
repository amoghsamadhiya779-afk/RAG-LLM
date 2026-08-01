import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ClipboardList,
  Lock,
  ShieldCheck,
  Trash2,
  Users,
  X,
  Briefcase,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

import { ShrinkNavbar } from "@/components/fx/ShrinkNavbar";
import { GlassPanel } from "@/components/ui-ext/GlassPanel";
import { GradientText } from "@/components/ui-ext/GradientText";
import { GradientButton } from "@/components/ui-ext/GradientButton";
import { Reveal } from "@/components/ui-ext/motion";
import { QueryBoundary } from "@/components/ui-ext/QueryBoundary";
import { Skeleton } from "@/components/ui-ext/Skeleton";
import { EmptyState } from "@/components/ui-ext/EmptyState";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useSession } from "@/features/auth/SessionProvider";
import { formatDistanceToNow } from "@/lib/date";
import {
  adminApproveJob,
  adminDeleteUser,
  adminListPendingJobs,
  adminListUsers,
  adminMetrics,
  adminRejectJob,
  adminUpdateUserRole,
} from "@/lib/api/admin";
import type { AdminUser, Job, Role } from "@/lib/api/types";

export const Route = createFileRoute("/admin")({
  staticData: { transition: "blurDissolve" },
  head: () => ({
    meta: [
      { title: "Admin — jOBiON" },
      { name: "description", content: "Moderation queue and user management." },
    ],
  }),
  component: AdminPage,
});

const PREVIEW_KEY = "jobion_admin_preview";

function isPreviewingAdmin() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(PREVIEW_KEY) === "1";
}

function AdminPage() {
  const { role, isLoading } = useSession();
  const [preview, setPreview] = useState<boolean>(isPreviewingAdmin());

  const isAdmin = role === "admin" || preview;

  return (
    <div className="min-h-screen bg-transparent text-foreground">
      <ShrinkNavbar />
      <div className="mx-auto max-w-7xl px-6 pt-28 pb-24">
        <Reveal>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-foreground transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </Link>
        </Reveal>

        <Reveal>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary/70 to-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.03em]">
                <GradientText>Admin</GradientText> console
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                Moderate submissions and manage the jOBiON community.
              </p>
            </div>
          </div>
        </Reveal>

        {!isAdmin ? (
          <RoleGate
            isLoading={isLoading}
            onPreview={() => {
              window.localStorage.setItem(PREVIEW_KEY, "1");
              setPreview(true);
            }}
          />
        ) : (
          <AdminWorkspace
            previewing={role !== "admin" && preview}
            onExitPreview={() => {
              window.localStorage.removeItem(PREVIEW_KEY);
              setPreview(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

function RoleGate({
  isLoading,
  onPreview,
}: {
  isLoading: boolean;
  onPreview: () => void;
}) {
  return (
    <div className="mt-16">
      <GlassPanel className="p-10 text-center max-w-xl mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-foreground/5 border border-foreground/10 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-6 h-6 text-zinc-400" />
        </div>
        <h2 className="text-2xl font-semibold tracking-[-0.02em] mb-2">
          Admins only
        </h2>
        <p className="text-sm text-zinc-500 mb-6">
          {isLoading
            ? "Checking your permissions…"
            : "Your account doesn't have admin access. If you believe this is a mistake, contact your workspace owner."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 h-10 rounded-lg bg-foreground/5 border border-foreground/10 hover:bg-foreground/10 text-sm transition"
          >
            Back to dashboard
          </Link>
          <button
            onClick={onPreview}
            className="inline-flex items-center px-4 h-10 rounded-lg border border-foreground/10 text-sm text-zinc-400 hover:text-foreground hover:bg-foreground/5 transition"
          >
            Preview as admin (demo)
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}

function AdminWorkspace({
  previewing,
  onExitPreview,
}: {
  previewing: boolean;
  onExitPreview: () => void;
}) {
  return (
    <div className="mt-10 space-y-8">
      {previewing && (
        <div className="rounded-xl border border-primary/40 bg-primary/20 px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-primary">
            Admin preview mode — you're browsing the admin console for demo purposes.
          </p>
          <button
            onClick={onExitPreview}
            className="text-xs text-primary hover:text-foreground underline underline-offset-4"
          >
            Exit preview
          </button>
        </div>
      )}

      <QueryBoundary fallback={<MetricsSkeleton />}>
        <MetricsRow />
      </QueryBoundary>

      <Tabs defaultValue="moderation" className="w-full">
        <TabsList className="bg-foreground/5 border border-foreground/10 rounded-lg p-1 h-11">
          <TabsTrigger
            value="moderation"
            className="data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground rounded-md px-4 h-9 text-sm"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Moderation queue
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground rounded-md px-4 h-9 text-sm"
          >
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
        </TabsList>
        <TabsContent value="moderation" className="mt-6">
          <QueryBoundary fallback={<QueueSkeleton />}>
            <ModerationQueue />
          </QueryBoundary>
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          <QueryBoundary fallback={<UsersSkeleton />}>
            <UsersTable />
          </QueryBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
  );
}

function MetricsRow() {
  const { data } = useSuspenseQuery({
    queryKey: ["admin", "metrics"],
    queryFn: adminMetrics,
  });
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard label="Users" value={data.users} icon={<Users className="w-4 h-4" />} />
      <KpiCard label="Jobs" value={data.jobs} icon={<Briefcase className="w-4 h-4" />} />
      <KpiCard
        label="Applications"
        value={data.applications}
        icon={<FileText className="w-4 h-4" />}
      />
      <KpiCard
        label="Pending review"
        value={data.pending_jobs}
        icon={<ClipboardList className="w-4 h-4" />}
      />
    </div>
  );
}

// ---------- Moderation queue ----------

function QueueSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}

function ModerationQueue() {
  const qc = useQueryClient();
  const { data } = useSuspenseQuery({
    queryKey: ["admin", "pending-jobs"],
    queryFn: adminListPendingJobs,
  });

  const approve = useMutation({
    mutationFn: (id: string) => adminApproveJob(id),
    onSuccess: (job) => {
      qc.setQueryData(
        ["admin", "pending-jobs"],
        (prev: typeof data | undefined) =>
          prev
            ? { ...prev, items: prev.items.filter((j) => j.id !== job.id), total: prev.total - 1 }
            : prev,
      );
      qc.invalidateQueries({ queryKey: ["admin", "metrics"] });
      toast.success("Job approved and set live");
    },
    onError: () => toast.error("Failed to approve job"),
  });

  const reject = useMutation({
    mutationFn: (id: string) => adminRejectJob(id),
    onSuccess: (job) => {
      qc.setQueryData(
        ["admin", "pending-jobs"],
        (prev: typeof data | undefined) =>
          prev
            ? { ...prev, items: prev.items.filter((j) => j.id !== job.id), total: prev.total - 1 }
            : prev,
      );
      qc.invalidateQueries({ queryKey: ["admin", "metrics"] });
      toast.success("Job rejected");
    },
    onError: () => toast.error("Failed to reject job"),
  });

  if (data.items.length === 0) {
    return (
      <EmptyState
        icon={<ShieldCheck className="w-6 h-6" />}
        title="Queue is clear"
        description="No jobs are awaiting moderation right now. Nice work."
      />
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {data.items.map((job) => (
          <motion.div
            key={job.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <PendingJobRow
              job={job}
              onApprove={() => approve.mutate(job.id)}
              onReject={() => reject.mutate(job.id)}
              busy={approve.isPending || reject.isPending}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function PendingJobRow({
  job,
  onApprove,
  onReject,
  busy,
}: {
  job: Job;
  onApprove: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  return (
    <GlassPanel className="p-5">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/10">
              Pending
            </Badge>
            <span className="text-xs text-zinc-500">
              submitted {formatDistanceToNow(job.created_at)}
            </span>
          </div>
          <Link
            to="/jobs/$id"
            params={{ id: job.id }}
            className="text-base font-medium tracking-[-0.02em] hover:text-foreground text-zinc-100 transition truncate block"
          >
            {job.title}
          </Link>
          <p className="text-sm text-zinc-500 mt-0.5 truncate">
            {typeof job.company === "string" ? job.company : job.company?.name || "Unknown"} · {job.location}
            {job.remote && " · Remote"}
          </p>
          {job.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {job.tags.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-foreground/5 border border-foreground/10 text-zinc-400"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            disabled={busy}
            onClick={onReject}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-foreground/10 bg-foreground/5 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300 text-sm text-zinc-300 transition disabled:opacity-50"
          >
            <X className="w-4 h-4" /> Reject
          </button>
          <GradientButton onClick={onApprove} disabled={busy} className="h-9 px-4 text-sm">
            <Check className="w-4 h-4 mr-1.5" /> Approve
          </GradientButton>
        </div>
      </div>
    </GlassPanel>
  );
}

// ---------- Users ----------

function UsersSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 rounded-xl" />
      ))}
    </div>
  );
}

const ROLE_COLORS: Record<Role, string> = {
  seeker: "bg-sky-500/10 text-sky-300 border-sky-500/30",
  employer: "bg-primary/20 text-primary border-primary/40",
  admin: "bg-primary/20 text-primary border-primary/40",
};

function UsersTable() {
  const qc = useQueryClient();
  const { data } = useSuspenseQuery({
    queryKey: ["admin", "users"],
    queryFn: adminListUsers,
  });
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return data.items.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (!query) return true;
      return (
        u.email.toLowerCase().includes(query) ||
        (u.full_name ?? "").toLowerCase().includes(query)
      );
    });
  }, [data.items, q, roleFilter]);

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => adminUpdateUserRole(id, role),
    onMutate: async ({ id, role }) => {
      await qc.cancelQueries({ queryKey: ["admin", "users"] });
      const prev = qc.getQueryData<typeof data>(["admin", "users"]);
      if (prev) {
        qc.setQueryData(["admin", "users"], {
          ...prev,
          items: prev.items.map((u) => (u.id === id ? { ...u, role } : u)),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["admin", "users"], ctx.prev);
      toast.error("Failed to update role");
    },
    onSuccess: () => toast.success("Role updated"),
  });

  const removeUser = useMutation({
    mutationFn: (id: string) => adminDeleteUser(id),
    onSuccess: (_r, id) => {
      qc.setQueryData<typeof data>(["admin", "users"], (prev) =>
        prev
          ? { ...prev, items: prev.items.filter((u) => u.id !== id), total: prev.total - 1 }
          : prev,
      );
      qc.invalidateQueries({ queryKey: ["admin", "metrics"] });
      toast.success("User removed");
    },
    onError: () => toast.error("Failed to remove user"),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search users by name or email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="bg-foreground/5 border-foreground/10 h-10"
        />
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as Role | "all")}>
          <SelectTrigger className="w-full sm:w-44 bg-foreground/5 border-foreground/10 h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="seeker">Seeker</SelectItem>
            <SelectItem value="employer">Employer</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-6 h-6" />}
          title="No users match"
          description="Try clearing filters or searching for a different name."
        />
      ) : (
        <GlassPanel className="p-0 overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-foreground/5 text-[10px] uppercase tracking-[0.12em] text-zinc-500">
            <div>User</div>
            <div className="hidden md:block">Joined</div>
            <div>Role</div>
            <div className="text-right">Actions</div>
          </div>
          <AnimatePresence initial={false}>
            {filtered.map((user) => (
              <motion.div
                key={user.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.3 }}
              >
                <UserRow
                  user={user}
                  onRoleChange={(role) => updateRole.mutate({ id: user.id, role })}
                  onDelete={() => removeUser.mutate(user.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </GlassPanel>
      )}
    </div>
  );
}

function UserRow({
  user,
  onRoleChange,
  onDelete,
}: {
  user: AdminUser;
  onRoleChange: (r: Role) => void;
  onDelete: () => void;
}) {
  const initials = (user.full_name ?? user.email)
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3 border-b border-foreground/5 last:border-b-0 hover:bg-foreground/[0.02] transition">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary border border-foreground/10 flex items-center justify-center text-xs font-mono text-foreground shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-zinc-100 truncate">{user.full_name ?? "—"}</p>
          <p className="text-xs text-zinc-500 truncate">{user.email}</p>
        </div>
      </div>
      <div className="hidden md:block text-xs text-zinc-500 font-mono">
        {formatDistanceToNow(user.created_at)}
      </div>
      <div>
        <Select value={user.role} onValueChange={(v) => onRoleChange(v as Role)}>
          <SelectTrigger
            className={`h-8 w-32 text-xs border ${ROLE_COLORS[user.role]} bg-transparent`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="seeker">Seeker</SelectItem>
            <SelectItem value="employer">Employer</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 hover:text-rose-300 hover:bg-rose-500/10 transition"
              aria-label="Delete user"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-transparent border-foreground/10">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {user.full_name ?? user.email}?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the user and all associated data. This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-foreground/5 border-foreground/10">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-rose-500 hover:bg-rose-600 text-foreground"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
