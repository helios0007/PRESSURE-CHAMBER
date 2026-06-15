import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The Flask backend (backend/app.py) serves the data, images, media and API
// endpoints on port 5000. During development Vite proxies those paths so the
// React app behaves exactly like the original static frontend did.
const backendProxyPaths = [
  "/start",
  "/generate",
  "/leaderboard",
  "/config",
  "/data",
  "/images",
  "/media",
  "/backend",
];

export default defineConfig({
  base: "/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: backendProxyPaths.reduce((acc, path) => {
      acc[path] = { target: "http://127.0.0.1:5000", changeOrigin: true };
      return acc;
    }, {}),
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
