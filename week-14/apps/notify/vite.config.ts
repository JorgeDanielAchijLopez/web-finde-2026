import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const API_URL = process.env.API_URL ?? "http://localhost:8787";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    strictPort: true,
    // Escucha en la red local (0.0.0.0) y acepta el dominio de ngrok.
    host: true,
    allowedHosts: [".ngrok-free.app", ".ngrok.app", ".ngrok.dev"],
    // El navegador solo habla con Vite (un origen, un túnel de ngrok, sin CORS).
    // Vite reenvía estas rutas al servidor Hono.
    proxy: {
      "/api": {
        target: API_URL,
        // Si la API se detiene, el proxy mantiene abierta la conexión del navegador
        // y EventSource nunca se entera. Cerramos también la respuesta al navegador
        // para que EventSource detecte el corte y reconecte solo.
        configure: (proxy) =>
          proxy.on("proxyRes", (proxyRes, _req, res) => {
            proxyRes.on("close", () => {
              if (!proxyRes.complete) res.destroy();
            });
          }),
      },
    },
  },
});
