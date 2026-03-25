import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/auth": "http://localhost:3000",
      "/tenants": "http://localhost:3000",
      "/public": "http://localhost:3000",
      "/tenant-api": "http://localhost:3000",
      "/health": "http://localhost:3000"
    }
  }
});
