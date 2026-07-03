import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Github, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui-ext/GradientButton";

const emailPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Minimum 8 characters"),
});
const magicSchema = z.object({ email: z.string().email("Enter a valid email") });

type EmailPasswordValues = z.infer<typeof emailPasswordSchema>;
type MagicValues = z.infer<typeof magicSchema>;

interface Props {
  redirectTo: string;
  intendedRole?: "seeker" | "employer";
}

export function AuthTabs({ redirectTo, intendedRole }: Props) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const callbackUrl = `${origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`;

  return (
    <Tabs defaultValue="signin" className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-white/5">
        <TabsTrigger value="signin">Sign in</TabsTrigger>
        <TabsTrigger value="signup">Sign up</TabsTrigger>
        <TabsTrigger value="magic">Magic link</TabsTrigger>
      </TabsList>

      <TabsContent value="signin" className="mt-6 space-y-6">
        <EmailPasswordForm mode="signin" redirectTo={callbackUrl} />
        <OAuthRow redirectTo={callbackUrl} />
      </TabsContent>

      <TabsContent value="signup" className="mt-6 space-y-6">
        <EmailPasswordForm mode="signup" redirectTo={callbackUrl} intendedRole={intendedRole} />
        <OAuthRow redirectTo={callbackUrl} />
      </TabsContent>

      <TabsContent value="magic" className="mt-6 space-y-6">
        <MagicLinkForm redirectTo={callbackUrl} />
        <OAuthRow redirectTo={callbackUrl} />
      </TabsContent>
    </Tabs>
  );
}

function EmailPasswordForm({
  mode,
  redirectTo,
  intendedRole,
}: {
  mode: "signin" | "signup";
  redirectTo: string;
  intendedRole?: "seeker" | "employer";
}) {
  const form = useForm<EmailPasswordValues>({
    resolver: zodResolver(emailPasswordSchema),
    defaultValues: { email: "", password: "" },
  });
  const [busy, setBusy] = useState(false);

  async function onSubmit(values: EmailPasswordValues) {
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword(values);
        if (error) throw error;
        toast.success("Signed in");
      } else {
        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            emailRedirectTo: redirectTo,
            data: intendedRole ? { intended_role: intendedRole } : undefined,
          },
        });
        if (error) throw error;
        toast.success("Check your inbox to confirm your email.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${mode}-email`}>Email</Label>
        <Input
          id={`${mode}-email`}
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-rose-400">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${mode}-password`}>Password</Label>
        <Input
          id={`${mode}-password`}
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder="••••••••"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-xs text-rose-400">{form.formState.errors.password.message}</p>
        )}
      </div>
      <GradientButton type="submit" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signin" ? "Sign in" : "Create account"}
      </GradientButton>
    </form>
  );
}

function MagicLinkForm({ redirectTo }: { redirectTo: string }) {
  const form = useForm<MagicValues>({
    resolver: zodResolver(magicSchema),
    defaultValues: { email: "" },
  });
  const [busy, setBusy] = useState(false);

  async function onSubmit(values: MagicValues) {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      toast.success("Magic link sent — check your inbox.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send magic link");
    } finally {
      setBusy(false);
    }
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
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-rose-400">{form.formState.errors.email.message}</p>
        )}
      </div>
      <GradientButton type="submit" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send magic link"}
      </GradientButton>
    </form>
  );
}

function OAuthRow({ redirectTo }: { redirectTo: string }) {
  const [busy, setBusy] = useState<null | "google" | "github">(null);

  async function oauth(provider: "google" | "github") {
    setBusy(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "OAuth failed");
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-white/40">
        <span className="h-px flex-1 bg-white/10" />
        or
        <span className="h-px flex-1 bg-white/10" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          className="border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
          onClick={() => oauth("google")}
          disabled={busy !== null}
        >
          {busy === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          <span className="ml-2">Google</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
          onClick={() => oauth("github")}
          disabled={busy !== null}
        >
          {busy === "github" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
          <span className="ml-2">GitHub</span>
        </Button>
      </div>
    </div>
  );
}
