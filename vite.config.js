import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
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
  ],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  server: {
    port: 5174,
    host: "0.0.0.0",
    strictPort: true, // This will fail if port 5174 is not available
    https: false, // Enable HTTPS for PWA install prompts on mobile devices
  },
});
