import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { OAuthRow } from "@/components/auth/OAuthRow";
import {
  mapAuthError,
  sanitizeRedirect,
  POST_AUTH_REDIRECT_KEY,
} from "@/components/auth/auth-errors";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GradientButton } from "@/components/ui-ext/GradientButton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ErrorState } from "@/components/ui-ext/ErrorState";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/login")({
  staticData: { transition: "fadeRise" },
  validateSearch: (raw) => searchSchema.parse(raw),
  head: () => ({
    meta: [
      { title: "Sign in — jOBiON" },
      {
        name: "description",
        content:
          "Sign in to jOBiON to save jobs, upload your resume, and run ATS scoring. One free plan, no billing.",
      },
      { property: "og:title", content: "Sign in — jOBiON" },
      {
        property: "og:description",
        content: "Real accounts, no paywalls. Continue as guest anytime.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ reset }) => (
    <div className="grid min-h-[60vh] place-items-center bg-[#0A0A0A] px-6 text-white">
      <ErrorState title="Sign-in unavailable" onRetry={reset} />
    </div>
  ),
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const redirectPath = sanitizeRedirect(search.redirect);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const callbackUrl = `${origin}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`;

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to jOBiON"
      subtitle="One free plan for everyone. No tiers, no billing — just your work, saved."
      footer={
        <p className="text-center text-white/60">
          New to jOBiON?{" "}
          <Link
            to="/signup"
            search={{ redirect: redirectPath === "/" ? undefined : redirectPath }}
            className="font-medium text-white underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
      }
    >
      <Tabs defaultValue="password" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/[0.04]">
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="magic">Magic link</TabsTrigger>
        </TabsList>
        <TabsContent value="password" className="mt-6 space-y-5">
          <PasswordSignInForm callbackUrl={callbackUrl} redirectPath={redirectPath} />
          <OAuthRow redirectTo={callbackUrl} postAuthPath={redirectPath} />
        </TabsContent>
        <TabsContent value="magic" className="mt-6 space-y-5">
          <MagicLinkForm callbackUrl={callbackUrl} />
          <OAuthRow redirectTo={callbackUrl} postAuthPath={redirectPath} />
        </TabsContent>
      </Tabs>
    </AuthShell>
  );
}

const pwSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password required"),
});

function PasswordSignInForm({
  callbackUrl,
  redirectPath,
}: {
  callbackUrl: string;
  redirectPath: string;
}) {
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof pwSchema>>({
    resolver: zodResolver(pwSchema),
    defaultValues: { email: "", password: "" },
  });
  const [busy, setBusy] = useState(false);

  async function onSubmit(values: z.infer<typeof pwSchema>) {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword(values);
      if (error) throw error;
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, redirectPath);
      }
      toast.success("Welcome back.");
      navigate({ to: redirectPath === "/" ? "/dashboard" : (redirectPath as string), replace: true });
    } catch (err) {
      toast.error(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  // Silence unused warning — callbackUrl is used for OAuth in sibling; keep param for parity.
  void callbackUrl;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input
          id="signin-email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          className="h-11 bg-white/[0.02]"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-rose-400">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="signin-password">Password</Label>
          <Link
            to="/forgot-password"
            className="text-xs text-white/50 underline-offset-4 hover:text-white hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="signin-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="h-11 bg-white/[0.02]"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-xs text-rose-400">{form.formState.errors.password.message}</p>
        )}
      </div>
      <GradientButton type="submit" className="h-11 w-full" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
      </GradientButton>
    </form>
  );
}

const magicSchema = z.object({ email: z.string().email("Enter a valid email") });

function MagicLinkForm({ callbackUrl }: { callbackUrl: string }) {
  const form = useForm<z.infer<typeof magicSchema>>({
    resolver: zodResolver(magicSchema),
    defaultValues: { email: "" },
  });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(values: z.infer<typeof magicSchema>) {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: { emailRedirectTo: callbackUrl },
      });
      if (error) throw error;
      setSent(true);
      toast.success("Magic link sent — check your inbox.");
    } catch (err) {
      toast.error(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/70">
        We sent a sign-in link to your inbox. Open it on this device to continue.
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="magic-email">Email</Label>
        <Input
          id="magic-email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          className="h-11 bg-white/[0.02]"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-rose-400">{form.formState.errors.email.message}</p>
        )}
      </div>
      <GradientButton type="submit" className="h-11 w-full" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send magic link"}
      </GradientButton>
    </form>
  );
}
