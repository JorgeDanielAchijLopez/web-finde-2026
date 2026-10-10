import { ClientMessageSchema } from "@week14/protocol";
import { Hono } from "hono";
import type { UpgradeWebSocket } from "hono/ws";
import type { ChatConnection } from "./chat.connection.ts";
import { createHeartbeat, type PingableSocket } from "./chat.heartbeat.ts";
import type { ChatService } from "./chat.service.ts";

// Adaptador de entrada (como un controller): traduce WebSocket <-> servicio.
// Aquí vive todo lo que depende de Hono y de la librería "ws";
// la lógica del chat está en chat.service.ts.
export function createChatRoutes(chatService: ChatService, upgradeWebSocket: UpgradeWebSocket) {
  const app = new Hono();
  const heartbeat = createHeartbeat();

  // GET /ws con el encabezado "Upgrade: websocket": HTTP se convierte en WebSocket.
  app.get(
    "/",
    upgradeWebSocket(() => {
      // Esta función se ejecuta una vez por conexión: las variables son de esa conexión.
      let connection: ChatConnection | undefined;
      let socket: PingableSocket | undefined;

      return {
        onOpen(_event, ws) {
          connection = { send: (message) => ws.send(JSON.stringify(message)) };
          // @hono/node-ws expone el socket original de la librería "ws" en ws.raw.
          socket = ws.raw as PingableSocket | undefined;
          if (socket) heartbeat.track(socket);
        },

        onMessage(event) {
          if (!connection) return;

          // Nunca confíe en lo que llega por la red: puede ser cualquier cosa.
          // Paso 1: ¿es JSON?
          let data: unknown;
          try {
            data = JSON.parse(String(event.data));
          } catch {
            connection.send({ type: "error", code: "INVALID_MESSAGE", message: "El mensaje no es JSON válido" });
            return;
          }

          // Paso 2: ¿cumple el contrato (ClientMessageSchema)?
          const result = ClientMessageSchema.safeParse(data);
          if (!result.success) {
            const detail = result.error.issues[0]?.message ?? "Formato desconocido";
            connection.send({ type: "error", code: "INVALID_MESSAGE", message: detail });
            return;
          }

          chatService.handle(connection, result.data);
        },

        onClose() {
          if (socket) heartbeat.untrack(socket);
          if (connection) chatService.disconnect(connection);
        },
      };
    }),
  );

  return app;
}
