import { z } from "zod";

// WebSocket solo envía y recibe mensajes. No tiene canales, ni "emit", ni "broadcast".
// Este archivo define NUESTRO protocolo de aplicación: los mensajes que el cliente
// y el servidor aceptan. El servidor y el frontend importan los mismos esquemas.

export const CHANNELS = ["FreeFire", "ClashRoyale", "FIFA"] as const;
export const ChannelSchema = z.enum(CHANNELS);
export type Channel = z.infer<typeof ChannelSchema>;

export const NicknameSchema = z
  .string()
  .trim()
  .min(2, "El apodo necesita al menos 2 caracteres")
  .max(20, "El apodo acepta máximo 20 caracteres")
  .regex(/^[\p{L}\p{N}_-]+$/u, "Use solo letras, números, _ o -");

// Emojis permitidos para reaccionar. La validación se comparte entre cliente y servidor.
export const ReactionEmojiSchema = z.enum(["👍", "❤️", "😂", "🔥", "👏"]);
export type ReactionEmoji = z.infer<typeof ReactionEmojiSchema>;

export const TextSchema = z
  .string()
  .trim()
  .min(1, "El mensaje está vacío")
  .max(500, "El mensaje acepta máximo 500 caracteres");

// ---------- Cliente -> Servidor ----------

export const ClientMessageSchema = z.discriminatedUnion("type", [
  // Primer mensaje obligatorio: identifica la conexión con un apodo.
  z.object({ type: z.literal("hello"), nickname: NicknameSchema }),
  z.object({ type: z.literal("join"), channel: ChannelSchema }),
  z.object({ type: z.literal("leave"), channel: ChannelSchema }),
  z.object({ type: z.literal("message"), channel: ChannelSchema, text: TextSchema }),
  // Mensaje directo: el servidor lo publica en la sala "dm:<a>:<b>".
  z.object({ type: z.literal("dm"), to: NicknameSchema, text: TextSchema }),
  z.object({
    type: z.literal("react"),
    channel: ChannelSchema,
    messageId: z.uuid(),
    emoji: ReactionEmojiSchema,
  }),
]);
export type ClientMessage = z.infer<typeof ClientMessageSchema>;

// ---------- Servidor -> Cliente ----------

export const ChatMessageSchema = z.object({
  id: z.string(),
  channel: ChannelSchema,
  from: z.string(),
  text: z.string(),
  sentAt: z.iso.datetime(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const DirectMessageSchema = z.object({
  id: z.string(),
  room: z.string(),
  from: z.string(),
  to: z.string(),
  text: z.string(),
  sentAt: z.iso.datetime(),
});
export type DirectMessage = z.infer<typeof DirectMessageSchema>;

export const ErrorCodeSchema = z.enum([
  "INVALID_MESSAGE",
  "NOT_IDENTIFIED",
  "NICKNAME_TAKEN",
  "NOT_IN_CHANNEL",
  "USER_NOT_FOUND",
]);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

export const ReactionEntrySchema = z.object({
  emoji: ReactionEmojiSchema,
  users: z.array(z.string()),
});
export type ReactionEntry = z.infer<typeof ReactionEntrySchema>;

export const ServerMessageSchema = z.discriminatedUnion("type", [
  // Respuesta a "hello": la conexión ya tiene apodo.
  z.object({
    type: z.literal("welcome"),
    nickname: z.string(),
    channels: z.array(ChannelSchema),
  }),
  // Presencia global: usuarios conectados (sirve para los mensajes directos).
  z.object({ type: z.literal("online"), users: z.array(z.string()) }),
  // Presencia por canal: usuarios dentro de un canal.
  z.object({ type: z.literal("presence"), channel: ChannelSchema, users: z.array(z.string()) }),
  z.object({ type: z.literal("message"), message: ChatMessageSchema }),
  z.object({ type: z.literal("dm"), message: DirectMessageSchema }),
  z.object({
    type: z.literal("reaction"),
    channel: ChannelSchema,
    messageId: z.uuid(),
    reactions: z.array(ReactionEntrySchema),
  }),
  z.object({ type: z.literal("error"), code: ErrorCodeSchema, message: z.string() }),
]);
export type ServerMessage = z.infer<typeof ServerMessageSchema>;

// Una sala de mensajes directos tiene el mismo nombre para los dos usuarios:
// dmRoom("luis", "ana") === dmRoom("ana", "luis") === "dm:ana:luis"
export function dmRoom(a: string, b: string): string {
  const [first, second] = [a, b].sort((x, y) => x.localeCompare(y));
  return `dm:${first}:${second}`;
}
