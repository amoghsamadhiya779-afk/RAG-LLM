import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { Route as RootRoute } from "./routes/__root";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: 1,
        retryDelay: 400,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: { retry: 0 },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Warm route chunks + loader data as soon as the user *intends* to
    // navigate (hover / focus). Query owns freshness — hence stale time 0.
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    // Show the route pending fallback quickly on slow networks, but keep it
    // on-screen long enough to avoid a jarring flash on fast ones.
    defaultPendingMs: 120,
    defaultPendingMinMs: 200,
    defaultErrorComponent: RootRoute.options.errorComponent || undefined,
    defaultNotFoundComponent: RootRoute.options.notFoundComponent || undefined,
  });

  return router;
};
