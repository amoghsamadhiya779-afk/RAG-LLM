import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { mapAuthError } from "@/components/auth/auth-errors";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GradientButton } from "@/components/ui-ext/GradientButton";
import { ErrorState } from "@/components/ui-ext/ErrorState";

export const Route = createFileRoute("/reset-password")({
  staticData: { transition: "fadeRise" },
  head: () => ({
    meta: [
      { title: "Set a new password — jOBiON" },
      { name: "description", content: "Choose a new password for your jOBiON account." },
      { property: "og:title", content: "Set a new password — jOBiON" },
      { property: "og:description", content: "Finish resetting your jOBiON password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ reset }) => (
    <div className="grid min-h-[60vh] place-items-center bg-transparent px-6 text-white">
      <ErrorState title="Couldn't load reset page" onRetry={reset} />
    </div>
  ),
  component: ResetPasswordPage,
});

const schema = z
  .object({
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Za-z]/, "Include a letter")
      .regex(/[0-9]/, "Include a number"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
    mode: "onChange",
  });
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);

  // Supabase parses the recovery token from the URL hash and fires a PASSWORD_RECOVERY event.
  useEffect(() => {
    let cancelled = false;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setReady(true);
      }
    });
    // If the hash is missing entirely, mark as invalid after a beat.
    const t = setTimeout(() => {
      if (cancelled) return;
      const hasRecoveryHash =
        typeof window !== "undefined" && window.location.hash.includes("type=recovery");
      supabase.auth.getSession().then(({ data }) => {
        if (cancelled) return;
        if (!data.session && !hasRecoveryHash) setInvalid(true);
        else setReady(true);
      });
    }, 800);
    return () => {
      cancelled = true;
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(values: z.infer<typeof schema>) {
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) throw error;
      toast.success("Password updated. You're signed in.");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  const pw = form.watch("password");
  const rules = [
    { label: "At least 8 characters", ok: pw.length >= 8 },
    { label: "Contains a letter", ok: /[A-Za-z]/.test(pw) },
    { label: "Contains a number", ok: /[0-9]/.test(pw) },
  ];

  return (
    <AuthShell
      eyebrow="New password"
      title="Set a new password"
      subtitle="Pick something strong — we'll sign you in as soon as it's saved."
      footer={
        <p className="text-center text-white/60">
          Wrong account?{" "}
          <Link to="/login" className="font-medium text-white underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      {invalid ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-4 text-sm text-rose-100/90">
            This reset link is invalid or has expired.
          </div>
          <Link
            to="/forgot-password"
            className="text-xs text-white/60 underline-offset-4 hover:text-white hover:underline"
          >
            Request a new link
          </Link>
        </div>
      ) : !ready ? (
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Loader2 className="h-4 w-4 animate-spin" /> Verifying reset link…
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              className="h-11 bg-white/[0.02]"
              {...form.register("password")}
            />
            <ul className="mt-2 grid grid-cols-1 gap-1 text-[11px]">
              {rules.map((r) => (
                <li
                  key={r.label}
                  className={`flex items-center gap-2 ${r.ok ? "text-emerald-300" : "text-white/40"}`}
                >
                  <Check
                    className={`h-3 w-3 ${r.ok ? "opacity-100" : "opacity-30"}`}
                    strokeWidth={3}
                  />
                  {r.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              className="h-11 bg-white/[0.02]"
              {...form.register("confirm")}
            />
            {form.formState.errors.confirm && (
              <p className="text-xs text-rose-400">{form.formState.errors.confirm.message}</p>
            )}
          </div>
          <GradientButton type="submit" className="h-11 w-full" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
          </GradientButton>
        </form>
      )}
    </AuthShell>
  );
}
