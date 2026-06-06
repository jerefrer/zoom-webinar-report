import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/zoom-webinar-report/" : "/",
  plugins: [react() as never, tailwindcss() as never],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  build: {
    rollupOptions: {
      input: {
        landing: path.resolve(__dirname, "index.html"),
        app: path.resolve(__dirname, "app/index.html"),
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    passWithNoTests: true,
    // Vitest runs the unit/component tests under src/. The e2e/ Playwright
    // specs use @playwright/test and must NOT be collected by Vitest.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
  },
});
