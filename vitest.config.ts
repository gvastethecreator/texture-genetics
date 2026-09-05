import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      clearMocks: true,
      environment: "jsdom",
      setupFiles: "./src/__tests__/setup.ts",
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      // Reuse one thread: the suite is small, WebGL imports are heavy, and spawning
      // one isolated jsdom worker per file was flaky on constrained developer hosts.
      pool: "threads",
      fileParallelism: false,
      isolate: false,
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html", "lcov"],
        reportsDirectory: "./coverage",
        include: ["src/**/*.{ts,tsx}"],
        exclude: ["src/__tests__/**", "src/types/**", "src/**/*.d.ts"],
        thresholds: {
          statements: 26,
          branches: 28,
          functions: 15,
          lines: 26,
        },
      },
    },
  }),
);
