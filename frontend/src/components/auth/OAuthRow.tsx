import { useState } from "react";
import { toast } from "sonner";
import { Github, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { mapAuthError, POST_AUTH_REDIRECT_KEY } from "./auth-errors";

interface Props {
  /** Full URL Supabase will redirect back to after OAuth completes. */
  redirectTo: string;
  /** Same-origin path we want the user to land on after callback. */
  postAuthPath: string;
}

export function OAuthRow({ redirectTo, postAuthPath }: Props) {
  const [busy, setBusy] = useState<null | "google" | "github">(null);

  async function oauth(provider: "google" | "github") {
    setBusy(provider);
    try {
      // Preserve intended destination across OAuth round-trip.
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, postAuthPath);
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(mapAuthError(err));
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
        <span className="h-px flex-1 bg-border dark:bg-white/10" />
        or continue with
        <span className="h-px flex-1 bg-border dark:bg-white/10" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 border-border dark:border-white/10 bg-input/50 dark:bg-white/[0.02] text-sm text-foreground hover:bg-muted dark:hover:bg-white/[0.06]"
          onClick={() => oauth("google")}
          disabled={busy !== null}
        >
          {busy === "google" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          <span className="ml-2">Google</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 border-border dark:border-white/10 bg-input/50 dark:bg-white/[0.02] text-sm text-foreground hover:bg-muted dark:hover:bg-white/[0.06]"
          onClick={() => oauth("github")}
          disabled={busy !== null}
        >
          {busy === "github" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Github className="h-4 w-4" />
          )}
          <span className="ml-2">GitHub</span>
        </Button>
      </div>
    </div>
  );
}
