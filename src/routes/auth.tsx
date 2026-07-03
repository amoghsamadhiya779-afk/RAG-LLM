import { createFileRoute, Navigate } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  redirect: z.string().optional(),
  role: z.enum(["seeker", "employer"]).optional(),
});

/**
 * Legacy /auth route — kept as a permanent redirect to /login so old links,
 * banners, and bookmarks keep working.
 */
export const Route = createFileRoute("/auth")({
  validateSearch: (raw) => searchSchema.parse(raw),
  head: () => ({ meta: [{ title: "Sign in — jOBiON" }] }),
  component: LegacyAuthRedirect,
});

function LegacyAuthRedirect() {
  const search = Route.useSearch();
  return (
    <Navigate
      to="/login"
      search={{ redirect: search.redirect }}
      replace
    />
  );
}
