import { z } from "zod";

// Server-Sent Events: el servidor envía eventos de texto al cliente.
// Este esquema valida el cuerpo del POST y el campo "data" de cada evento.

export const NotificationLevelSchema = z.enum(["info", "success", "warning"]);
export type NotificationLevel = z.infer<typeof NotificationLevelSchema>;

export const NotificationInputSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(80),
  body: z.string().trim().max(280).default(""),
  level: NotificationLevelSchema.default("info"),
});
export type NotificationInput = z.infer<typeof NotificationInputSchema>;

export const NotificationSchema = NotificationInputSchema.extend({
  // El id también viaja en el campo "id:" del evento SSE.
  // EventSource lo devuelve en la cabecera Last-Event-ID al reconectar.
  id: z.number().int().positive(),
  createdAt: z.iso.datetime(),
});
export type Notification = z.infer<typeof NotificationSchema>;

// Nombre del evento SSE (campo "event:"). El cliente escucha con addEventListener("notification", ...).
export const NOTIFICATION_EVENT = "notification";
