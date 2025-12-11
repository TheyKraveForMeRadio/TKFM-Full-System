import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  server: {
    port: 5176,
    strictPort: true
  },

  publicDir: "assets",

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
