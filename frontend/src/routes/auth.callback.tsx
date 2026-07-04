import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeRedirect, POST_AUTH_REDIRECT_KEY } from "@/components/auth/auth-errors";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (raw) => searchSchema.parse(raw),
  head: () => ({ meta: [{ title: "Signing you in — jOBiON" }] }),
  component: AuthCallbackPage,
});

function resolveTarget(fromSearch: string | undefined): string {
  if (fromSearch) return sanitizeRedirect(fromSearch);
  if (typeof window !== "undefined") {
    const stashed = window.sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
    if (stashed) {
      window.sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
      return sanitizeRedirect(stashed);
    }
  }
  return "/dashboard";
}

function AuthCallbackPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const target = resolveTarget(redirect);

    async function finish() {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session && !data.session.user.is_anonymous) {
        navigate({ to: target, replace: true });
        return;
      }
      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        if (cancelled) return;
        if (
          session &&
          !session.user.is_anonymous &&
          (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION")
        ) {
          sub.subscription.unsubscribe();
          navigate({ to: target, replace: true });
        }
      });
      setTimeout(() => {
        if (cancelled) return;
        sub.subscription.unsubscribe();
        navigate({ to: "/login", replace: true });
      }, 8000);
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, [navigate, redirect]);

  return (
    <div className="grid min-h-[100svh] place-items-center bg-transparent text-white">
      <div className="flex items-center gap-3 text-white/60">
        <Loader2 className="h-4 w-4 animate-spin" />
        Signing you in…
      </div>
    </div>
  );
}
