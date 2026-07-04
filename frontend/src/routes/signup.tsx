import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";
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
import { ErrorState } from "@/components/ui-ext/ErrorState";

const searchSchema = z.object({
  redirect: z.string().optional(),
  role: z.enum(["seeker", "employer"]).optional(),
});

export const Route = createFileRoute("/signup")({
  staticData: { transition: "fadeRise" },
  validateSearch: (raw) => searchSchema.parse(raw),
  head: () => ({
    meta: [
      { title: "Create your account — jOBiON" },
      {
        name: "description",
        content:
          "Create a free jOBiON account to save jobs, upload your resume, and unlock ATS scoring across devices.",
      },
      { property: "og:title", content: "Create your account — jOBiON" },
      {
        property: "og:description",
        content: "One free plan for everyone. No tiers, no billing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ reset }) => (
    <div className="grid min-h-[60vh] place-items-center bg-[#0A0A0A] px-6 text-white">
      <ErrorState title="Sign-up unavailable" onRetry={reset} />
    </div>
  ),
  component: SignupPage,
});

const signUpSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Za-z]/, "Include a letter")
    .regex(/[0-9]/, "Include a number"),
});

function SignupPage() {
  const search = Route.useSearch();
  const redirectPath = sanitizeRedirect(search.redirect);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const callbackUrl = `${origin}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`;

  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your jOBiON account"
      subtitle="One free plan for everyone. Your saved jobs, resume, and ATS reports follow you across devices."
      footer={
        <p className="text-center text-white/60">
          Already have an account?{" "}
          <Link
            to="/login"
            search={{ redirect: redirectPath === "/" ? undefined : redirectPath }}
            className="font-medium text-white underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <div className="space-y-5">
        <SignUpForm callbackUrl={callbackUrl} redirectPath={redirectPath} intendedRole={search.role} />
        <OAuthRow redirectTo={callbackUrl} postAuthPath={redirectPath} />
        <p className="text-center text-[11px] leading-relaxed text-white/40">
          By continuing you agree to our{" "}
          <Link to="/features" className="underline-offset-4 hover:text-white hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link to="/features" className="underline-offset-4 hover:text-white hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </AuthShell>
  );
}

function SignUpForm({
  callbackUrl,
  redirectPath,
  intendedRole,
}: {
  callbackUrl: string;
  redirectPath: string;
  intendedRole?: "seeker" | "employer";
}) {
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  });
  const [busy, setBusy] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const pw = form.watch("password");
  const rules = [
    { label: "At least 8 characters", ok: pw.length >= 8 },
    { label: "Contains a letter", ok: /[A-Za-z]/.test(pw) },
    { label: "Contains a number", ok: /[0-9]/.test(pw) },
  ];

  async function onSubmit(values: z.infer<typeof signUpSchema>) {
    setBusy(true);
    try {
      if (typeof window !== "undefined" && intendedRole) {
        window.sessionStorage.setItem("jobion.intendedRole", intendedRole);
      }
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: callbackUrl,
          data: intendedRole ? { intended_role: intendedRole } : undefined,
        },
      });
      if (error) throw error;
      if (data.session) {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, redirectPath);
        }
        toast.success("Account created.");
        navigate({
          to: redirectPath === "/" ? "/dashboard" : (redirectPath as string),
          replace: true,
        });
      } else {
        setEmailSent(true);
        toast.success("Check your inbox to confirm your email.");
      }
    } catch (err) {
      toast.error(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  if (emailSent) {
    return (
      <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-emerald-100/90">
        We sent a confirmation link to your email. Open it to activate your account.
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
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
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a strong password"
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
      <GradientButton type="submit" className="h-11 w-full" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
      </GradientButton>
    </form>
  );
}
