import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { networkInterfaces } from "node:os";
import type { Broker } from "./broker/broker.ts";
import { InMemoryBroker } from "./broker/in-memory.broker.ts";
import { createChatRoutes } from "./modules/chat/chat.routes.ts";
import { ChatService } from "./modules/chat/chat.service.ts";
import { createNotificationsRoutes } from "./modules/notifications/notifications.routes.ts";
import { NotificationsService } from "./modules/notifications/notifications.service.ts";

// Composition root: aquí se construyen las piezas y se conectan.
// Infraestructura (broker) -> servicios (lógica) -> rutas (entrada HTTP/WebSocket).

const PORT = Number(process.env.PORT ?? 8787);

const app = new Hono();
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

// Para varios servidores: cambie solo esta línea por new RedisBroker(url).
const broker: Broker = new InMemoryBroker();
const chatService = new ChatService(broker);
const notificationsService = new NotificationsService(broker);

app.use("/api/*", logger());
app.use("/api/*", cors());

app.get("/api/health", (c) => c.json({ ok: true }));
app.route("/ws", createChatRoutes(chatService, upgradeWebSocket));
app.route("/api/notifications", createNotificationsRoutes(notificationsService));

const server = serve({ fetch: app.fetch, port: PORT, hostname: "0.0.0.0" }, (info) => {
  console.log(`API escuchando en http://localhost:${info.port}`);
  for (const address of lanAddresses()) {
    console.log(`              red local: http://${address}:${info.port}`);
  }
});

// Sin esta línea el servidor HTTP no acepta el "Upgrade: websocket".
injectWebSocket(server);

function lanAddresses(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((net) => net !== undefined && net.family === "IPv4" && !net.internal)
    .map((net) => net!.address);
}
