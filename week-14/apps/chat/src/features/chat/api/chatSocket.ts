import { ServerMessageSchema } from "@week14/protocol";
import type { Channel, ClientMessage, ServerMessage } from "@week14/protocol";

export type ConnectionStatus = "connecting" | "open" | "closed";

type ChatSocketHandlers = {
  onMessage: (message: ServerMessage) => void;
  onStatus: (status: ConnectionStatus) => void;
};

const MAX_RETRY_DELAY_MS = 10_000;

// Cliente tipado sobre el WebSocket del navegador.
//
// Diferencia con SSE: EventSource se reconecta SOLO. El WebSocket del
// navegador no: si la conexión se cae, se queda cerrada. Por eso aquí
// programamos la reconexión a mano y, al volver, repetimos "hello" y los "join"
// (el servidor nuevo no recuerda nada de la conexión anterior).
export class ChatSocket {
  readonly #nickname: string;
  readonly #handlers: ChatSocketHandlers;
  // Canales a los que el usuario se unió: se vuelven a unir al reconectar.
  readonly #channels = new Set<Channel>();
  #socket: WebSocket | null = null;
  #retries = 0;
  #retryTimer: ReturnType<typeof setTimeout> | undefined;
  #closedByUser = false;
  // true después del primer "welcome": desde ahí, cada conexión nueva es una reconexión.
  #welcomed = false;

  constructor(nickname: string, handlers: ChatSocketHandlers) {
    this.#nickname = nickname;
    this.#handlers = handlers;
  }

  connect(): void {
    // Mismo host que la página: funciona con el proxy de Vite y con ngrok (https -> wss).
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${location.host}/ws`);
    this.#socket = socket;
    this.#handlers.onStatus("connecting");

    socket.addEventListener("open", () => {
      this.#handlers.onStatus("open");
      // El primer mensaje siempre es hello: el servidor no sabe quiénes somos.
      this.#write({ type: "hello", nickname: this.#nickname });
    });

    socket.addEventListener("message", (event) => {
      // Nunca confíe en lo que llega por la red, tampoco en el cliente.
      let data: unknown;
      try {
        data = JSON.parse(String(event.data));
      } catch {
        console.warn("Mensaje que no es JSON", event.data);
        return;
      }
      const result = ServerMessageSchema.safeParse(data);
      if (!result.success) {
        console.warn("Mensaje con formato desconocido", data);
        return;
      }

      // Reconexión con apodo "ocupado": el servidor todavía guarda nuestra
      // conexión anterior (zombi). El heartbeat la elimina en máximo 60 s,
      // entonces cerramos y reintentamos con backoff en vez de mostrar el error.
      if (result.data.type === "error" && result.data.code === "NICKNAME_TAKEN" && this.#welcomed) {
        socket.close();
        return;
      }

      if (result.data.type === "welcome") {
        this.#welcomed = true;
        this.#retries = 0; // conexión sana: reinicia la espera
        for (const channel of this.#channels) this.#write({ type: "join", channel });
      }
      this.#handlers.onMessage(result.data);
    });

    socket.addEventListener("close", () => {
      this.#handlers.onStatus("closed");
      if (!this.#closedByUser) this.#scheduleReconnect();
    });
  }

  send(message: ClientMessage): void {
    if (message.type === "join") this.#channels.add(message.channel);
    if (message.type === "leave") this.#channels.delete(message.channel);
    this.#write(message);
  }

  close(): void {
    this.#closedByUser = true;
    clearTimeout(this.#retryTimer);
    this.#socket?.close();
  }

  #write(message: ClientMessage): void {
    if (this.#socket?.readyState === WebSocket.OPEN) {
      this.#socket.send(JSON.stringify(message));
    }
  }

  // Backoff exponencial: 1 s, 2 s, 4 s, 8 s, 10 s, 10 s...
  // Evita que cien celulares golpeen al servidor al mismo tiempo.
  #scheduleReconnect(): void {
    const delay = Math.min(1000 * 2 ** this.#retries, MAX_RETRY_DELAY_MS);
    this.#retries += 1;
    this.#retryTimer = setTimeout(() => this.connect(), delay);
  }
}
