// Heartbeat (latido): detecta conexiones "zombis".
//
// Si un celular pierde la señal, el servidor NO recibe ningún "close":
// el socket parece abierto para siempre. Cada 30 s enviamos un ping
// (control frame del protocolo WebSocket); el navegador responde pong solo.
// Si en la siguiente ronda no llegó el pong, cerramos el socket a la fuerza.

const HEARTBEAT_INTERVAL_MS = 30_000;

// Lo que usamos del socket de la librería "ws" (ws.raw en @hono/node-ws).
export interface PingableSocket {
  ping(): void;
  terminate(): void;
  on(event: "pong", listener: () => void): unknown;
}

export function createHeartbeat() {
  // socket -> ¿respondió al último ping?
  const alive = new Map<PingableSocket, boolean>();

  const timer = setInterval(() => {
    for (const [socket, answered] of alive) {
      if (!answered) {
        // terminate() dispara el evento close -> onClose -> chatService.disconnect().
        socket.terminate();
        alive.delete(socket);
        continue;
      }
      alive.set(socket, false);
      socket.ping();
    }
  }, HEARTBEAT_INTERVAL_MS);
  timer.unref(); // el intervalo no impide que el proceso termine

  return {
    track(socket: PingableSocket): void {
      alive.set(socket, true);
      socket.on("pong", () => alive.set(socket, true));
    },
    untrack(socket: PingableSocket): void {
      alive.delete(socket);
    },
  };
}
