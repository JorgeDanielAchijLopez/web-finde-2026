import type { ServerMessage } from "@week14/protocol";

// Lo único que el servicio necesita de una conexión: poder enviarle un mensaje.
// El servicio no conoce Hono ni la librería "ws"; las rutas crean este objeto.
// Así la lógica del chat se puede probar con un objeto falso { send() {} }.
export interface ChatConnection {
  send(message: ServerMessage): void;
}
