import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { readMockSession } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: ({ location }) => {
    const session = readMockSession();
    if (!session) throw redirect({ to: "/auth", search: { redirect: location.href } });
    return { session };
  },
  component: () => <Outlet />,
});
