import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()], //ADDED eslint() TO ARRAY HERE
    server: {
        port: 5174,
        proxy: {
            "/api": "http://localhost:3001",
        },
    },
});
