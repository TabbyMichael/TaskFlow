import { resolve } from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Standalone Vitest config. We intentionally do NOT reuse vite.config.ts because
// it loads the TanStack Start / Nitro plugin stack, which is server-build
// oriented and incompatible with the jsdom unit-test runner.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  // Tests live at the repo root (../tests), outside this config's directory.
  server: { fs: { allow: [resolve(__dirname, "..")] } },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [resolve(__dirname, "../tests/setup/vitest.setup.ts")],
    css: false,
    include: [resolve(__dirname, "../tests/**/*.{test,spec}.{ts,tsx}")],
    exclude: [resolve(__dirname, "../tests/e2e/**")],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reportsDirectory: resolve(__dirname, "../tests/coverage"),
      reporter: ["text", "text-summary", "html", "lcov", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/routeTree.gen.ts",
        "src/router.tsx",
        "src/server.ts",
        "src/start.ts",
        "src/components/ui/**",
        "src/lib/error-capture.ts",
        "src/lib/lovable-error-reporting.ts",
        "src/lib/error-page.ts",
        "src/lib/config.server.ts",
        "src/lib/api/**",
      ],
    },
  },
});
