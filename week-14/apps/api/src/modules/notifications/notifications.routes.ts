import { zValidator } from "@hono/zod-validator";
import { NOTIFICATION_EVENT, NotificationInputSchema, type Notification } from "@week14/protocol";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { z } from "zod";
import type { NotificationsService } from "./notifications.service.ts";

// Adaptador HTTP: traduce peticiones HTTP a llamadas del servicio.
//
// Formato de SSE en la red (texto plano, cada evento termina con una línea vacía):
//
//   retry: 3000                  <- espera antes de reconectar (milisegundos)
//
//   event: notification          <- nombre del evento (addEventListener en el cliente)
//   data: {"title":"Hola",...}   <- contenido (aquí, JSON)
//   id: 7                        <- el navegador lo devuelve en Last-Event-ID
//
//   : ping                       <- comentario: el navegador lo ignora

const RETRY_MS = 3000;
const HEARTBEAT_MS = 15_000;

export function createNotificationsRoutes(service: NotificationsService) {
  const app = new Hono();

  // GET /api/notifications -> conexión SSE abierta (respuesta HTTP que no termina).
  app.get("/", (c) =>
    streamSSE(c, async (stream) => {
      // Al reconectar, EventSource envía el último id recibido en la cabecera Last-Event-ID.
      // Un EventSource nuevo no puede enviar cabeceras: el cliente usa ?lastEventId= en la URL.
      const lastEventId = Number(c.req.header("Last-Event-ID") ?? c.req.query("lastEventId") ?? 0) || 0;

      const send = (notification: Notification) =>
        stream.writeSSE({
          id: String(notification.id),
          event: NOTIFICATION_EVENT,
          data: JSON.stringify(notification),
        });

      // Leer lo perdido y suscribirse en el mismo paso (sin await en medio):
      // así ninguna notificación queda en el hueco entre las dos operaciones.
      const missed = service.since(lastEventId);
      const unsubscribe = service.subscribe((notification) => void send(notification));
      stream.onAbort(unsubscribe);

      await stream.write(`retry: ${RETRY_MS}\n\n`);
      for (const notification of missed) await send(notification);

      // Mantener la respuesta abierta. Los proxies (ngrok, nginx) cierran
      // conexiones sin tráfico, por eso enviamos un comentario cada 15 s.
      while (!stream.aborted) {
        await stream.sleep(HEARTBEAT_MS);
        if (!stream.aborted) await stream.write(": ping\n\n");
      }
    }),
  );

  // POST /api/notifications -> publicar. Es HTTP normal: SSE solo va del servidor al cliente.
  app.post(
    "/",
    zValidator("json", NotificationInputSchema, (result, c) => {
      if (!result.success) {
        return c.json({ errors: z.flattenError(result.error).fieldErrors }, 400);
      }
    }),
    (c) => {
      const notification = service.publish(c.req.valid("json"));
      return c.json(notification, 201);
    },
  );

  return app;
}
