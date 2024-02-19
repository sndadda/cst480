import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import eslint from "vite-plugin-eslint"; // ADDED THIS

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), eslint()], //ADDED eslint() TO ARRAY HERE
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});