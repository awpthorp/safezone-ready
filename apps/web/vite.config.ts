import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  optimizeDeps: {
    include: ["@safezone-ready/safezone-specs"],
  },
  server: {
    host: "0.0.0.0",
    port: 43173,
    strictPort: true,
    fs: {
      allow: [path.resolve(__dirname, "../..")],
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 43173,
    strictPort: true,
  },
});
