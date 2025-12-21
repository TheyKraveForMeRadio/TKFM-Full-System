import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        news: resolve(__dirname, "news.html"),
        submit: resolve(__dirname, "submit.html"),
        sponsors: resolve(__dirname, "sponsors.html"),
        mixtapes: resolve(__dirname, "mixtapes.html"),
        dj: resolve(__dirname, "dj.html"),
        success: resolve(__dirname, "success.html"),
        media: resolve(__dirname, "tkfm-media-kit.html"),
        admin: resolve(__dirname, "admin/index.html"),
        adminLogin: resolve(__dirname, "admin/login.html")
      }
    }
  }
});
