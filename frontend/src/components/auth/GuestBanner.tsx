import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, Sparkles, AlertTriangle, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useSession } from "@/features/auth/SessionProvider";
import { dismissGuestBanner, isGuestBannerDismissed } from "@/lib/guest-store";
import {
  useGuestDataExpiry,
  purgeGuestData,
} from "@/hooks/useGuestDataExpiry";

/** Shown at the top of seeker workspace pages while browsing as a guest. */
export function GuestBanner() {
  const { isGuest, isLoading } = useSession();
  const expiryStatus = useGuestDataExpiry(isGuest);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    setVisible(isGuest && !isGuestBannerDismissed());
  }, [isGuest, isLoading]);

  function dismiss() {
    dismissGuestBanner();
    setVisible(false);
  }

  function clearData() {
    purgeGuestData();
    toast.success("Guest data cleared", {
      description: "Your local saves, resume, and history were removed.",
    });
  }

  const warning = expiryStatus === "warning";
  const currentPath =
    typeof window !== "undefined" ? window.location.pathname : "/";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className={
            "mb-6 flex flex-col gap-3 rounded-2xl border px-4 py-3 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-5 " +
            (warning
              ? "border-amber-400/30 bg-amber-500/[0.06]"
              : "border-border bg-foreground/[0.03]")
          }
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white"
              style={{
                background: warning
                  ? "linear-gradient(135deg,#F59E0B,#6AA2FF)"
                  : "var(--gradient-brand)",
              }}
              aria-hidden
            >
              {warning ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </span>
            <p className="min-w-0 text-sm text-foreground/70">
              {warning ? (
                <>
                  Your guest data expires <strong className="text-foreground">tomorrow</strong>.{" "}
                  <Link
                    to="/signup"
                    search={{ redirect: currentPath }}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Create a free account
                  </Link>{" "}
                  to keep it.
                </>
              ) : (
                <>
                  You&rsquo;re browsing as a guest &mdash; your data won&rsquo;t be saved across devices.{" "}
                  <Link
                    to="/login"
                    search={{ redirect: currentPath }}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Create a free account
                  </Link>
                  .
                </>
              )}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={clearData}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-foreground/[0.03] px-2.5 py-1 text-[11px] font-medium text-foreground/70 transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
            >
              <Trash2 className="h-3 w-3" />
              Clear my guest data
            </button>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss"
              className="-m-1.5 rounded-full p-1.5 text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
