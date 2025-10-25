import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    react(),
    svgr({
      // svgr options: https://react-svgr.com/docs/options/
      svgrOptions: {
        exportType: "default",
        ref: true,
        svgo: false,
        titleProp: true,
      },
      // A minimatch pattern, or array of patterns, which specifies the files in the build the plugin should include
      include: "**/*.svg?react",
    }),
    viteStaticCopy({
      targets: [
        {
          src: "sw.js",
          dest: "",
        },
      ],
    }),
  ],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 5174,
    strictPort: true, // This will fail if port 5174 is not available
  },
});
