import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const API_URL = process.env.API_URL ?? "http://localhost:8787";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    // Escucha en la red local (0.0.0.0) y acepta el dominio de ngrok.
    host: true,
    allowedHosts: [".ngrok-free.app", ".ngrok.app", ".ngrok.dev"],
    // El navegador solo habla con Vite (un origen, un túnel de ngrok, sin CORS).
    // Vite reenvía estas rutas al servidor Hono.
    proxy: {
      "/ws": { target: API_URL, ws: true },
    },
  },
});
