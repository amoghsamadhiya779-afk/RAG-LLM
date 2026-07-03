import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { initSentry } from "@/lib/observability/sentry";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { SessionProvider } from "@/features/auth/SessionProvider";
import { env } from "@/lib/env";
import { ScrollProgress } from "@/components/fx";
import { GlassPanel } from "@/components/ui-ext/GlassPanel";
import { LenisProvider } from "@/components/landing/LenisProvider";
import { GalaxyBackground } from "@/components/landing/GalaxyBackground";
import { PageTransition } from "@/components/layout/PageTransition";

import { useRouterState } from "@tanstack/react-router";

// Defer non-critical overlays so they never block first paint / dashboards.
const CommandPalette = lazy(() =>
  import("@/components/fx/CommandPalette").then((m) => ({ default: m.CommandPalette })),
);
const ChatOrb = lazy(() =>
  import("@/components/fx/ChatOrb").then((m) => ({ default: m.ChatOrb })),
);
import BrandReveal from "@/components/brand/BrandReveal";
import { MiniBrandPending } from "@/components/brand/MiniBrandPending";

function BoundaryShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(60% 40% at 50% 20%, rgba(46,111,255,0.12), transparent 60%), radial-gradient(50% 40% at 80% 80%, rgba(76,130,255,0.08), transparent 60%)",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative z-10 w-full max-w-lg">{children}</div>
    </div>
  );
}

function ClientPath() {
  const [path, setPath] = useState("");
  useEffect(() => {
    setPath(window.location.pathname);
  }, []);
  return (
    <p className="mt-3 font-mono text-xs text-muted-foreground">
      <span className="text-primary">$</span> curl -I{" "}
      <span className="text-foreground/80">{path || "/"}</span>{" "}
      <span className="text-destructive">→ 404</span>
    </p>
  );
}

function NotFoundComponent() {
  return (
    <BoundaryShell>
      <GlassPanel className="p-8 text-center sm:p-10">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-3 py-1 font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_currentColor]" />
          Error 404
        </div>
        <h1 className="mt-6 text-7xl font-semibold tracking-[-0.05em] text-foreground sm:text-8xl">
          404
        </h1>
        <ClientPath />

        <h2 className="mt-6 text-xl font-semibold tracking-tight text-foreground">
          This route isn't on the board.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for was moved, renamed, or never shipped. Let's get you back to jobs that exist.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
          >
            Back to home
          </Link>
          <Link
            to="/jobs"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Browse jobs
          </Link>
        </div>
      </GlassPanel>
    </BoundaryShell>
  );
}


function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <BoundaryShell>
      <GlassPanel className="p-8 sm:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 font-mono text-[11px] tracking-widest text-destructive uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive shadow-[0_0_10px_currentColor]" />
          Runtime exception
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
          Something crashed on our side.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Our monitors already logged this. Retry the request or head back home — your session is safe.
        </p>
        <pre className="mt-5 max-h-40 overflow-auto rounded-xl border border-border/60 bg-background/50 p-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
          <span className="text-primary">Error</span>: {error.message || "Unknown error"}
        </pre>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
          >
            Try again
          </button>

          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl border border-border/60 bg-background/40 px-5 py-2.5 text-sm font-medium text-foreground backdrop-blur transition-colors hover:bg-accent/40"
          >
            Go home
          </Link>
        </div>
      </GlassPanel>
    </BoundaryShell>
  );
}

const CSP = [
  "default-src 'self'",
  // 'unsafe-inline'/'unsafe-eval' are unfortunately required by React DevTools + shader libs in dev.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co ${env.API_URL ?? ""} https://*.sentry.io https://challenges.cloudflare.com`,
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { httpEquiv: "Content-Security-Policy", content: CSP },
      { name: "referrer", content: "strict-origin-when-cross-origin" },
      { title: "jOBiON — AI-powered tech job board with ATS scoring" },
      {
        name: "description",
        content:
          "jOBiON is a premium tech job board with AI resume analysis and ATS scoring. Find roles, tune your resume, and beat the bots.",
      },
      { name: "author", content: "jOBiON" },
      { property: "og:title", content: "jOBiON — AI-powered tech job board" },
      {
        property: "og:description",
        content: "Premium tech jobs, AI resume analysis, and ATS scoring in one place.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "jOBiON" },
      { property: "og:image", content: "/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@jobion" },
      { name: "twitter:image", content: "/og-image.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/jobion-mark.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      // Warm up the two hosts every authenticated page hits.
      { rel: "preconnect", href: env.SUPABASE_URL, crossOrigin: "anonymous" },
      ...(env.API_URL
        ? [{ rel: "preconnect", href: env.API_URL, crossOrigin: "anonymous" as const }]
        : []),
      { rel: "dns-prefetch", href: "https://challenges.cloudflare.com" },
      // Warm the font hosts so Inter arrives before first paint.
      { rel: "preconnect", href: "https://fonts.googleapis.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
  pendingComponent: MiniBrandPending,
  pendingMs: 120,
  pendingMinMs: 220,
});


function EnvError({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-lg rounded-xl border border-destructive/40 bg-destructive/5 p-6">
        <h1 className="text-lg font-semibold">Environment misconfigured</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <p className="mt-4 text-xs text-muted-foreground">
          Set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and either VITE_API_URL or
          VITE_USE_MOCKS=true.
        </p>
      </div>
    </div>
  );
}

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let t = localStorage.getItem('jobion.theme') || 'system';
                let d = document.documentElement;
                let c = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
                if (c === 'dark') {
                  d.classList.add('dark');
                  d.classList.remove('light');
                  d.style.colorScheme = 'dark';
                } else {
                  d.classList.add('light');
                  d.classList.remove('dark');
                  d.style.colorScheme = 'light';
                }
                let meta = document.createElement('meta');
                meta.name = 'theme-color';
                meta.content = c === 'dark' ? '#0B0C0E' : '#FAFAFB';
                document.head.appendChild(meta);
                
                if (sessionStorage.getItem('jobion:intro-seen') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                  d.classList.add('intro-seen');
                }
              } catch(e) {}
            `,
          }}
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    void initSentry();
  }, []);

  if (!env.READY) {
    return <EnvError message={env.ERROR ?? "Missing environment variables"} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider delayDuration={200}>
          <SessionProvider>
            <LenisProvider>
              <GalaxyBackground />
              <ScrollProgress />
              <BrandReveal />
              <PageTransition>
                <Outlet />
              </PageTransition>
              <Suspense fallback={null}>
                <CommandPalette />
                <ChatOrb />
              </Suspense>
              <Toaster richColors position="top-right" theme="system" />
            </LenisProvider>
          </SessionProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}




