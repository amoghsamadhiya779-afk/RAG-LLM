/**
 * Guest-mode local persistence. All seeker data written while unauthenticated
 * lives here and is migrated into the user's account on sign-in.
 * Keep the shape flat and JSON-serializable.
 */

export interface GuestSnapshot {
  savedJobs: string[];
  applications: Array<{ job_id: string; created_at: string; note?: string }>;
  resumeMeta: { file_name: string; uploaded_at: string; size: number } | null;
  atsReports: Array<{ id: string; job_id: string; score: number; created_at: string }>;
  chatHistory: Array<{ role: "user" | "assistant"; content: string; ts: number }>;
}

const KEY = "jobion.guest";

const empty: GuestSnapshot = {
  savedJobs: [],
  applications: [],
  resumeMeta: null,
  atsReports: [],
  chatHistory: [],
};

export function readGuestSnapshot(): GuestSnapshot {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<GuestSnapshot>;
    return { ...empty, ...parsed };
  } catch {
    return empty;
  }
}

export function writeGuestSnapshot(patch: Partial<GuestSnapshot>) {
  if (typeof window === "undefined") return;
  const next = { ...readGuestSnapshot(), ...patch };
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

export function updateGuestSnapshot(fn: (s: GuestSnapshot) => GuestSnapshot) {
  writeGuestSnapshot(fn(readGuestSnapshot()));
}

export function clearGuestStore() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

const BANNER_KEY = "jobion.guest.banner.dismissed";

export function isGuestBannerDismissed(): boolean {
  if (typeof window === "undefined") return true;
  return window.sessionStorage.getItem(BANNER_KEY) === "1";
}

export function dismissGuestBanner() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(BANNER_KEY, "1");
}
