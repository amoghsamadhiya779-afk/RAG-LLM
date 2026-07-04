import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/hooks/use-auth";
import DotFieldBackground from "@/components/landing/DotFieldBackground";
import { ThemeProvider } from "@/components/theme-provider";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-display-xl font-display text-primary font-bold">404</h1>
        <h2 className="mt-4 text-body-lg font-heading">Page not found</h2>
        <p className="mt-2 text-small text-secondary">
          That route doesn't exist. Head back to find a job.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-small font-ui text-primary-foreground transition-colors hover:opacity-90"
          >
            Browse jobs
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-body-lg font-heading tracking-tight">Something broke</h1>
        <p className="mt-2 text-small text-secondary">Try again or head home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-primary px-4 py-2 text-small font-ui text-primary-foreground"
          >
            Try again
          </button>
          <a href="/" className="rounded-md border border-input px-4 py-2 text-small">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "jOBiON — AI-native tech job board" },
      { name: "description", content: "Find tech jobs and internships matched to you. Browse roles, post openings, hire engineers — built for builders." },
      { property: "og:title", content: "jOBiON — AI-native tech job board" },
      { property: "og:description", content: "Find tech jobs and internships matched to you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0B0C0E" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' rx='12' fill='%23e5e5e5'/><text x='50%' y='50%' font-family='sans-serif' font-size='14' font-weight='700' fill='%23000000' dominant-baseline='central' text-anchor='middle'>J</text></svg>" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  
  const [shouldRenderDotField, setShouldRenderDotField] = useState(false);

  useEffect(() => {
    if (pathname === "/") {
      setShouldRenderDotField(false);
      return;
    }
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (mql.matches || isMobile) {
      setShouldRenderDotField(false);
    } else {
      setShouldRenderDotField(true);
    }
  }, [pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="jobion:theme">
        <AuthProvider>
          {shouldRenderDotField && <DotFieldBackground />}
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col min-h-dvh relative z-10"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
          <Toaster 
            position="top-center"
            toastOptions={{
              className: 'font-ui text-small bg-void border border-bone/10 text-bone',
            }} 
          />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
