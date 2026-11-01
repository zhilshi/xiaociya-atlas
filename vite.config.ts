import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Deploy under a sub-path with APP_BASE=/words/ npm run build
  base: process.env.APP_BASE || "/",
  plugins: [react()],
  server: { port: 5188, strictPort: true },
  preview: { port: 5188, strictPort: true },
  build: { chunkSizeWarningLimit: 600 },
});
