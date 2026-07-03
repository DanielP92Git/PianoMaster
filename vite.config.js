import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { visualizer } from "rollup-plugin-visualizer";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { readFileSync } from "fs";
import { execSync } from "child_process";
import path from "path";
const pkg = JSON.parse(readFileSync("./package.json", "utf8"));

// Load .env from the main repository root, even when running inside a git
// worktree (.claude/worktrees/*). The .env file is gitignored and lives only
// in the main checkout, so worktrees would otherwise be missing it and crash
// with "Missing VITE_SUPABASE_URL". `git rev-parse --git-common-dir` returns
// the shared .git dir (absolute from a worktree, ".git" from the main repo);
// its parent is the main repo root. Falls back to cwd if git is unavailable
// (e.g. CI/Netlify, where env vars come from the platform, not .env files).
function resolveEnvDir() {
  try {
    const gitCommonDir = execSync("git rev-parse --git-common-dir", {
      encoding: "utf8",
    }).trim();
    return path.dirname(path.resolve(gitCommonDir));
  } catch {
    return process.cwd();
  }
}

const mainRepoRoot = resolveEnvDir();

export default defineConfig({
  envDir: mainRepoRoot,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    sourcemap: true,
  },
  plugins: [
    react(),
    svgr({
      // svgr options: https://react-svgr.com/docs/options/
      svgrOptions: {
        // pass options to svgr
      },
      // esbuild options, to transform jsx to js
      esbuildOptions: {
        // ...
      },
      // A minimatch pattern, or array of patterns, which specifies the files in the build the plugin should include
      include: "**/*.svg?react",
    }),
    visualizer({
      filename: "dist/bundle-stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: "treemap",
      title: "PianoApp2 Bundle Analysis",
    }),
    // Upload source maps to Sentry (only when env vars are set)
    process.env.SENTRY_AUTH_TOKEN &&
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
      }),
  ].filter(Boolean),
  server: {
    port: 5174,
    host: true, // Bind to all interfaces so other devices on the LAN (e.g. phone) can connect
    strictPort: true, // This will fail if port 5174 is not available
    https: false, // Enable HTTPS for PWA install prompts on mobile devices
    fs: {
      // Allow serving files from the main repo root in addition to the worktree
      // root. Git worktrees (.claude/worktrees/*) have no node_modules of their
      // own, so dependencies — including the @fontsource font files served via
      // /@fs/ — resolve up to the main checkout. Without this, Vite blocks those
      // files with 403 Forbidden because they live outside the worktree root.
      allow: [process.cwd(), mainRepoRoot],
    },
  },
});
