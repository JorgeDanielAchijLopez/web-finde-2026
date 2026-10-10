import { NotificationSchema, type Notification, type NotificationInput } from "@week14/protocol";

// Publicar es una petición HTTP normal (POST). SSE no sirve para enviar.

export type FieldErrors = Partial<Record<keyof NotificationInput, string[]>>;

export type SendResult =
  | { ok: true; notification: Notification }
  | { ok: false; message: string; errors: FieldErrors };

export async function sendNotification(input: unknown): Promise<SendResult> {
  try {
    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (response.status === 400) {
      // El servidor responde { errors: { campo: ["mensaje"] } }.
      const { errors } = (await response.json()) as { errors: FieldErrors };
      return { ok: false, message: "El servidor rechazó los datos", errors };
    }
    if (!response.ok) {
      return { ok: false, message: `Error HTTP ${response.status}`, errors: {} };
    }

    return { ok: true, notification: NotificationSchema.parse(await response.json()) };
  } catch {
    return { ok: false, message: "No se pudo contactar al servidor", errors: {} };
  }
}
