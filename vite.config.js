import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // In development the React app (port 5173) forwards /api calls to the Express server (port 4000),
  // so the browser sees ONE origin and the login cookie just works.
  server: { proxy: { "/api": { target: process.env.API_URL ?? "http://localhost:4000", changeOrigin: false } } },
  preview: { proxy: { "/api": { target: process.env.API_URL ?? "http://localhost:4000" } } },
  // Vitest reads this block when you run `npm test`.
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    globals: true,
    css: false,
    include: ["src/**/*.test.{js,jsx}"],
    testTimeout: 30_000, // the first PGlite start can be slow on a cold machine
  },
});
