import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  build: {
    rollupOptions: {
      input: "index.html", // 🚨 ONLY THIS PAGE IS THE ENTRY
    },
  },
  server: {
    port: 5173,
  },
  optimizeDeps: {
    exclude: ["_HOLD"], // 🚫 ignore archive folder
  },
});
