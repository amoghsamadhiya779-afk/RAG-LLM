import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  FileText,
  Loader2,
  LogOut,
  Monitor,
  Moon,
  ShieldAlert,
  Sun,
  Trash2,
  User,
} from "lucide-react";

import { ShrinkNavbar } from "@/components/fx/ShrinkNavbar";
import { Footer } from "@/components/landing/Footer";
import { GlassPanel } from "@/components/ui-ext/GlassPanel";
import { GradientText } from "@/components/ui-ext/GradientText";
import { Reveal } from "@/components/ui-ext/motion";

import { EmptyState } from "@/components/ui-ext/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { useTheme } from "@/components/theme/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import { deleteAccount, updateMe } from "@/lib/api/me";
import { deleteResume, listResumes } from "@/lib/api/resumes";
import type { Resume } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/layout/BackButton";

export const Route = createFileRoute("/settings")({
  staticData: { transition: "fadeRise" },
  head: () => ({
    meta: [
      { title: "Settings — jOBiON" },
      {
        name: "description",
        content:
          "Manage your jOBiON profile, appearance, account and delete your resumes to exercise your right to erasure.",
      },
      { property: "og:title", content: "Settings — jOBiON" },
      {
        property: "og:description",
        content:
          "Profile, theme, account and PII controls for your jOBiON account.",
      },
    ],
  }),
  component: SettingsPage,
});

/* ------------------------------- Page shell ------------------------------ */

function SettingsPage() {
  return (
    <div className="relative min-h-screen bg-background">
      <ShrinkNavbar />
      <main className="mx-auto w-full max-w-5xl px-6 pb-24 pt-28">
        <BackButton fallback="/dashboard" className="mb-6" />
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            ~/settings
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            <GradientText>Account settings</GradientText>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Profile, appearance, account and privacy controls — including
            deleting resumes to exercise your right to erasure.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6">
          <ProfileSection />
          <AppearanceSection />
          <ResumesSection />
          <AccountSection />
          <DangerSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ------------------------------- Profile -------------------------------- */

const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, "Name cannot be empty")
    .max(80, "Max 80 characters"),
  avatar_url: z
    .string()
    .trim()
    .max(500, "URL is too long")
    .url("Must be a valid URL")
    .or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;

function initials(name: string | null | undefined, email: string) {
  const base = name?.trim() || email;
  return base
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function ProfileSection() {
  const { me, isLoading } = useSession();
  const qc = useQueryClient();

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "", avatar_url: "" },
    values: me
      ? { full_name: me.full_name ?? "", avatar_url: me.avatar_url ?? "" }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: (values: ProfileForm) =>
      updateMe({
        full_name: values.full_name,
        avatar_url: values.avatar_url ? values.avatar_url : null,
      }),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Could not update profile");
    },
  });

  return (
    <Reveal>
      <SectionCard
        icon={<User className="h-4 w-4" />}
        title="Profile"
        description="How you appear to employers and across jOBiON."
      >
        {isLoading || !me ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        ) : (
          <form
            className="grid gap-6"
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
          >
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border border-border/60">
                <AvatarImage
                  src={form.watch("avatar_url") || undefined}
                  alt={me.full_name ?? me.email}
                />
                <AvatarFallback className="bg-gradient-to-br from-primary via-primary/70 to-primary font-mono text-sm">
                  {initials(me.full_name, me.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-mono text-sm">{me.email}</p>
                <Badge
                  variant="outline"
                  className="mt-1 border-border/50 bg-background/40 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                >
                  {me.role}
                </Badge>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="full_name" className="font-mono text-xs uppercase tracking-widest">
                Display name
              </Label>
              <Input
                id="full_name"
                autoComplete="name"
                placeholder="Your full name"
                {...form.register("full_name")}
              />
              {form.formState.errors.full_name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.full_name.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="avatar_url" className="font-mono text-xs uppercase tracking-widest">
                Avatar URL
              </Label>
              <Input
                id="avatar_url"
                placeholder="https://…"
                {...form.register("avatar_url")}
              />
              {form.formState.errors.avatar_url && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.avatar_url.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={mutation.isPending || !form.formState.isDirty}
                onClick={() =>
                  form.reset({
                    full_name: me.full_name ?? "",
                    avatar_url: me.avatar_url ?? "",
                  })
                }
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || !form.formState.isDirty}
              >
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save changes
              </Button>
            </div>
          </form>
        )}
      </SectionCard>
    </Reveal>
  );
}

/* ------------------------------ Appearance ------------------------------ */

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const options = useMemo(
    () =>
      [
        { value: "light", label: "Light", icon: Sun },
        { value: "dark", label: "Dark", icon: Moon },
        { value: "system", label: "System", icon: Monitor },
      ] as const,
    [],
  );

  return (
    <Reveal>
      <SectionCard
        icon={<Moon className="h-4 w-4" />}
        title="Appearance"
        description="Theme applies instantly and is remembered on this device."
      >
        <div className="grid grid-cols-3 gap-3">
          {options.map((opt) => {
            const active = theme === opt.value;
            const Icon = opt.icon;
            return (
              <motion.button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "group relative flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-colors",
                  active
                    ? "border-transparent bg-gradient-to-br from-primary via-primary/70 to-primary text-foreground ring-1 ring-ring/60"
                    : "border-border/60 bg-background/40 text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-mono text-xs uppercase tracking-widest">
                  {opt.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </SectionCard>
    </Reveal>
  );
}

/* -------------------------------- Resumes ------------------------------- */

function ResumesSection() {
  const query = useQuery({
    queryKey: ["resumes"],
    queryFn: () => listResumes(),
  });

  return (
    <Reveal>
      <SectionCard
        icon={<FileText className="h-4 w-4" />}
        title="Resumes"
        description="Delete a resume to remove the file, its parsed text and every ATS score derived from it."
      >
        {query.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : query.isError ? (
          <EmptyState
            title="Couldn't load resumes"
            description={
              query.error instanceof Error
                ? query.error.message
                : "Please try again."
            }
          />
        ) : !query.data || query.data.items.length === 0 ? (
          <EmptyState
            title="No resumes uploaded"
            description="Upload a resume from the dashboard to enable ATS scoring and personalized matches."
          />
        ) : (
          <ul className="divide-y divide-border/60 rounded-xl border border-border/60 bg-background/30">
            {query.data.items.map((r: Resume) => (
              <ResumeRow key={r.id} resume={r} />
            ))}
          </ul>
        )}
      </SectionCard>
    </Reveal>
  );
}

function ResumeRow({ resume }: { resume: Resume }) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => deleteResume(resume.id),
    onSuccess: () => {
      toast.success("Resume deleted");
      qc.invalidateQueries({ queryKey: ["resumes"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Could not delete resume");
    },
  });

  const sizeKb = resume.size_bytes ? Math.max(1, Math.round(resume.size_bytes / 1024)) : null;

  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg border border-border/60 bg-background/60">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-mono text-sm">{resume.filename}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(resume.created_at).toLocaleDateString()}
            {sizeKb ? ` · ${sizeKb} KB` : ""}
          </p>
        </div>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this resume?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <span className="font-mono">{resume.filename}</span>{" "}
              from storage along with any parsed content and ATS scores derived
              from it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete resume
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}

/* -------------------------------- Account ------------------------------- */

function AccountSection() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await qc.cancelQueries();
      qc.clear();
      await supabase.auth.signOut();
      toast.success("Signed out");
      navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign out failed");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <Reveal>
      <SectionCard
        icon={<LogOut className="h-4 w-4" />}
        title="Session"
        description="Sign out of this device. Your data stays intact."
      >
        <div className="flex items-center justify-end">
          <Button variant="outline" onClick={handleSignOut} disabled={signingOut}>
            {signingOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            Sign out
          </Button>
        </div>
      </SectionCard>
    </Reveal>
  );
}

/* -------------------------------- Danger -------------------------------- */

function DangerSection() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      await deleteAccount();
      await supabase.auth.signOut().catch(() => undefined);
    },
    onSuccess: () => {
      qc.clear();
      toast.success("Your account has been deleted");
      navigate({ to: "/", replace: true });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Could not delete account");
    },
  });

  const canDelete = confirm.trim().toUpperCase() === "DELETE";

  return (
    <Reveal>
      <GlassPanel className="border-destructive/40 bg-destructive/[0.04] p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-destructive/40 bg-destructive/10 text-destructive">
            <ShieldAlert className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em]">Delete account</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Permanently erase your profile, resumes, applications and ATS
              scores. This exercises your right to erasure and cannot be undone.
            </p>
          </div>
        </div>

        <Separator className="my-5 bg-destructive/20" />

        <AlertDialog
          onOpenChange={(open) => {
            if (!open) setConfirm("");
          }}
        >
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete my account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your profile, resumes, uploaded
                files, applications and ATS scores. Type{" "}
                <span className="font-mono text-foreground">DELETE</span> to
                confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              autoFocus
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="DELETE"
              className="font-mono"
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={!canDelete || mutation.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  if (!canDelete) return;
                  mutation.mutate();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Erase everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </GlassPanel>
    </Reveal>
  );
}

/* ------------------------------ Section card ---------------------------- */

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <GlassPanel className="p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg border border-border/60 bg-background/60 text-muted-foreground">
          {icon}
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.02em]">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </GlassPanel>
  );
}
