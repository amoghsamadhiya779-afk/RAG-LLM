import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { Briefcase, ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GlassPanel } from "@/components/ui-ext/GlassPanel";
import { GradientButton } from "@/components/ui-ext/GradientButton";
import { TurnstileGate, TURNSTILE_ENABLED } from "@/components/security/TurnstileGate";
import { GuestActionHint } from "@/components/guest/GuestActionHint";
import { useSession } from "@/features/auth/SessionProvider";
import { GuestActionHint } from "@/components/guest/GuestActionHint";
import { useSession } from "@/features/auth/SessionProvider";

interface Props {
  title?: string;
  description?: string;
}

/**
 * Inline, non-blocking upsell rendered in place of write UI for non-recruiter
 * visitors on the /employer surface.
 * - Guests → prompt to sign up as recruiter.
 * - Signed-in seekers → one-click self-serve upgrade via server endpoint.
 * - Server is the sole grantor (see becomeRecruiter contract).
 */
export function RecruiterUpsellPanel({
  title = "This is the recruiter workspace",
  description = "Post free listings, review applicants, and see ATS-matched candidates. Create a free recruiter account to unlock posting.",
}: Props) {
  const { isGuest } = useSession();
  const { isGuest } = useSession();
  const router = useRouter();

  return (
    <GlassPanel className="p-8 sm:p-10">
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white"
            style={{ background: "var(--gradient-brand)" }}
            aria-hidden
          >
            <Briefcase className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-medium tracking-[-0.02em] text-white">
              {title}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-white/60">{description}</p>
            {isGuest && (
              <div className="mt-3">
                <GuestActionHint label="Guest — sign in to unlock" />
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isGuest ? (
            <Link
              to="/signup"
              search={{ redirect: "/employer", role: "employer" }}
            >
              <GradientButton className="gap-2">
                Create free recruiter account
                <ArrowUpRight className="h-4 w-4" />
              </GradientButton>
            </Link>
          ) : (
            <Link to="/employer/onboarding">
              <GradientButton className="gap-2">
                Enable recruiter tools
                <ArrowUpRight className="h-4 w-4" />
              </GradientButton>
            </Link>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
