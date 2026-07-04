import { Link } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { useSession } from "@/features/auth/SessionProvider";
import { remainingFor, type GuestAction } from "@/lib/guest/quota";

interface Props {
  action?: GuestAction;
  label?: string;
  className?: string;
}

/**
 * Compact inline reminder rendered next to Save/Apply/Upload actions when the
 * viewer is a guest. Shows remaining daily quota if an action is provided.
 */
export function GuestActionHint({ action, label, className }: Props) {
  const { isGuest } = useSession();
  if (!isGuest) return null;
  const left = action ? remainingFor(action) : null;
  const currentPath =
    typeof window !== "undefined" ? window.location.pathname : "/";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] tracking-wide text-white/60 ${
        className ?? ""
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80 shadow-[0_0_6px_currentColor]" />
      {label ??
        (left !== null
          ? left > 0
            ? `${left} left today (guest)`
            : "Guest daily limit reached"
          : "Guest — not saved")}
      <Link
        to="/login"
        search={{ redirect: currentPath }}
        className="ml-1 inline-flex items-center gap-1 text-white/80 underline-offset-4 hover:underline"
      >
        <LogIn className="h-3 w-3" /> sign in
      </Link>
    </span>
  );
}
