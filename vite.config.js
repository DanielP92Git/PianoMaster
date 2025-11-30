import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

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
  ],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  server: {
    port: 5174,
    host: "0.0.0.0",
    strictPort: true, // This will fail if port 5174 is not available
  },
});
