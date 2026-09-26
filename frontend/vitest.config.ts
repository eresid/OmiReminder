import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    passWithNoTests: true,
    projects: [
      {
        extends: true,
        test: {
          name: "main",
          environment: "node",
          // Time zone tests change `process.env.TZ`, which needs a separate process per file.
          pool: "forks",
          include: ["src/main/**/*.test.ts", "src/preload/**/*.test.ts", "src/shared/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "renderer",
          environment: "jsdom",
          include: ["src/renderer/**/*.test.{ts,tsx}"],
        },
      },
    ],
  },
});
