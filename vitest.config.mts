import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname),
      "server-only": path.resolve(import.meta.dirname, "tests/empty-module.ts"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["tests/setup-env.ts"],
    // Integration tests share one Neon test branch; run files one at a time.
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
