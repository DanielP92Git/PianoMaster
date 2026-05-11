import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setupTests.js"],
    include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
    env: {
      VITE_SUPABASE_URL: "http://localhost:54321",
      VITE_SUPABASE_ANON_KEY: "stub-anon-key-for-tests",
    },
  },
});
