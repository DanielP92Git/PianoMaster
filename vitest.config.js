import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setupTests.js"],
    include: [
      "src/**/*.{test,spec}.{js,jsx,ts,tsx}",
      // Phase 01 Plan 01: validator-rule unit tests live next to the script
      // they test (`scripts/__tests__/*.test.mjs`) so the test file can use a
      // relative dynamic import after `vi.mock`-ing `src/data/skillTrail.js`.
      "scripts/**/__tests__/*.{test,spec}.{js,mjs}",
    ],
    env: {
      VITE_SUPABASE_URL: "http://localhost:54321",
      VITE_SUPABASE_ANON_KEY: "stub-anon-key-for-tests",
    },
  },
});
