import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    react(),
    svgr({
      // Only process SVGs imported with ?react suffix
      include: "**/*.svg?react",
      svgrOptions: {
        // Enable ref forwarding
        ref: true,
        // Add props to SVG
        titleProp: true,
      },
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
