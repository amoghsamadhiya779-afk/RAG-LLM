import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | number | Date | null | undefined, fallback = "—"): string {
  if (!dateString) return fallback;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString();
}

export function formatDistanceSafe(dateString: string | number | Date | null | undefined, fallback = "—"): string {
  if (!dateString) return fallback;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return fallback;
  return formatDistanceToNow(d, { addSuffix: true });
}
