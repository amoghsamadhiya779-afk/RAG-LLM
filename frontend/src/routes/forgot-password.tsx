import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { mapAuthError } from "@/components/auth/auth-errors";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GradientButton } from "@/components/ui-ext/GradientButton";
import { ErrorState } from "@/components/ui-ext/ErrorState";

export const Route = createFileRoute("/forgot-password")({
  staticData: { transition: "fadeRise" },
  head: () => ({
    meta: [
      { title: "Reset your password — jOBiON" },
      {
        name: "description",
        content: "Request a password reset link for your jOBiON account.",
      },
      { property: "og:title", content: "Reset your password — jOBiON" },
      {
        property: "og:description",
        content: "We'll email you a secure link to set a new password.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ reset }) => (
    <div className="grid min-h-[60dvh] place-items-center bg-transparent px-6 text-foreground">
      <ErrorState title="Couldn't load reset page" onRetry={reset} />
    </div>
  ),
  component: ForgotPasswordPage,
});

const schema = z.object({ email: z.string().email("Enter a valid email") });

function ForgotPasswordPage() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(values: z.infer<typeof schema>) {
    setBusy(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Reset link sent — check your inbox.");
    } catch (err) {
      toast.error(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Password reset"
      title="Forgot your password?"
      subtitle="No stress — enter your email and we'll send a secure link to set a new one."
      footer={
        <p className="text-center text-muted-foreground">
          Remembered it?{" "}
          <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      {sent ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-100/90">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <Mail className="h-4 w-4" /> Check your inbox
            </div>
            We sent a reset link to <span className="font-medium">{form.getValues("email")}</span>.
            The link expires in 1 hour.
          </div>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Send to a different email
          </button>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              className="h-11 bg-input/50 dark:bg-white/[0.02]"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-rose-400">{form.formState.errors.email.message}</p>
            )}
          </div>
          <GradientButton type="submit" className="h-11 w-full" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
          </GradientButton>
        </form>
      )}
    </AuthShell>
  );
}
