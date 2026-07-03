// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    build: {
      // Split large third-party libs into separate long-cacheable chunks so
      // route bundles stay small and users don't re-download React on every
      // deploy. Keys become chunk file names under /assets.
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("react-dom") || id.match(/[\\/]react[\\/]/))
              return "vendor-react";
            if (id.includes("framer-motion") || id.includes("motion-dom"))
              return "vendor-motion";
            if (id.includes("@supabase")) return "vendor-supabase";
            if (id.includes("@tanstack")) return "vendor-tanstack";
            if (
              id.includes("three") ||
              id.includes("ogl") ||
              id.includes("gsap")
            )
              return "vendor-visuals";
            if (id.includes("recharts") || id.includes("d3-"))
              return "vendor-charts";
          },
        },
      },
    },
    ssr: {
      noExternal: ['gsap', 'ogl', 'three']
    }
  },
});
