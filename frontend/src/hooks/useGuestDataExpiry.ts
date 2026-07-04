import { useEffect, useState } from "react";
import { toast } from "sonner";
import { clearGuestStore } from "@/lib/guest-store";
import { clearGuestQuota } from "@/lib/guest/quota";

const STAMP_KEY = "jobion.guest.first_seen";
const WARN_KEY = "jobion.guest.expiry_warned";
const DAY_MS = 24 * 60 * 60 * 1000;
const WARN_AT_DAYS = 6;
const PURGE_AT_DAYS = 7;

export type GuestExpiryStatus = "fresh" | "warning" | "purged" | "n/a";

function readStamp(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STAMP_KEY);
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function writeStamp(ts: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STAMP_KEY, String(ts));
}

export function purgeGuestData() {
  clearGuestStore();
  clearGuestQuota();
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STAMP_KEY);
    window.localStorage.removeItem(WARN_KEY);
  }
}

/**
 * Guest data auto-expiry (G2).
 * - Stamps first-seen on mount if missing.
 * - Day 6: sets `warning` (banner can flip to amber and show CTA).
 * - Day 7: purges guest data + shows toast.
 * - Signed-in users skip the whole flow.
 */
export function useGuestDataExpiry(isGuest: boolean): GuestExpiryStatus {
  const [status, setStatus] = useState<GuestExpiryStatus>("n/a");

  useEffect(() => {
    if (!isGuest || typeof window === "undefined") {
      setStatus("n/a");
      return;
    }
    const now = Date.now();
    const stamp = readStamp() ?? (writeStamp(now), now);
    const ageDays = (now - stamp) / DAY_MS;

    if (ageDays >= PURGE_AT_DAYS) {
      purgeGuestData();
      writeStamp(now); // restart the clock
      setStatus("purged");
      toast("Your guest data was cleared", {
        description: "Guest sessions expire after 7 days. Sign in to keep future work.",
      });
      return;
    }

    if (ageDays >= WARN_AT_DAYS) {
      setStatus("warning");
      if (window.localStorage.getItem(WARN_KEY) !== "1") {
        window.localStorage.setItem(WARN_KEY, "1");
        toast("Your guest data expires tomorrow", {
          description: "Create a free account to keep your saved jobs and resume.",
        });
      }
      return;
    }

    setStatus("fresh");
  }, [isGuest]);

  return status;
}
