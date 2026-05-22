import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: { port: 5173 },
  // @ts-expect-error vitest extends Vite config at runtime
  test: {
    environment: "node",
    globals: false,
    // Playwright e2e specs live under e2e/ and need a real browser runner.
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
  },
});
