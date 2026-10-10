import { NOTIFICATION_EVENT, NotificationSchema, type Notification } from "@week14/protocol";

// EventSource es la API del navegador para Server-Sent Events:
// - Solo hace GET y solo recibe (servidor -> cliente). Para enviar se usa fetch.
// - Si la conexión se cae, reconecta SOLA y envía la cabecera Last-Event-ID
//   con el último id recibido. El servidor reenvía lo que nos perdimos.
// - Excepción: si al reconectar el servidor responde con un error HTTP
//   (500, 502...), EventSource se rinde para siempre (readyState CLOSED).
//   Un proxy o un load balancer responde 502 mientras el servidor reinicia,
//   por eso aquí creamos un EventSource nuevo en ese caso.

export type StreamStatus = "connecting" | "open" | "reconnecting" | "closed";

type Handlers = {
  onNotification: (notification: Notification) => void;
  onStatus: (status: StreamStatus) => void;
};

const RESTART_DELAY_MS = 3000;

// Abre la conexión y devuelve una función para cerrarla.
export function connectNotifications({ onNotification, onStatus }: Handlers): () => void {
  let source: EventSource;
  let lastEventId = "";
  let restartTimer: ReturnType<typeof setTimeout> | undefined;

  function open() {
    // Un EventSource nuevo no envía Last-Event-ID (no se pueden poner cabeceras),
    // entonces enviamos el último id en la URL. El servidor acepta las dos formas.
    const query = lastEventId ? `?lastEventId=${encodeURIComponent(lastEventId)}` : "";
    source = new EventSource(`/api/notifications${query}`);

    // El servidor envía "event: notification", por eso no usamos onmessage.
    source.addEventListener(NOTIFICATION_EVENT, (event) => {
      lastEventId = event.lastEventId;
      // Nunca confíe en lo que llega por la red: validamos con el mismo esquema del servidor.
      let data: unknown;
      try {
        data = JSON.parse(event.data);
      } catch {
        console.warn("Notificación que no es JSON", event.data);
        return;
      }
      const result = NotificationSchema.safeParse(data);
      if (result.success) onNotification(result.data);
      else console.warn("Notificación inválida", result.error);
    });

    source.onopen = () => onStatus("open");

    source.onerror = () => {
      // CONNECTING: el navegador ya está reintentando (espera el "retry" del servidor).
      if (source.readyState === EventSource.CONNECTING) {
        onStatus("reconnecting");
        return;
      }
      // CLOSED: EventSource se rindió. Creamos uno nuevo después de una pausa.
      onStatus("reconnecting");
      restartTimer = setTimeout(open, RESTART_DELAY_MS);
    };
  }

  onStatus("connecting");
  open();

  return () => {
    clearTimeout(restartTimer);
    source.close();
    onStatus("closed");
  };
}
