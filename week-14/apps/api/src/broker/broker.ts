// Puerto (port): lo que los servicios necesitan para distribuir mensajes.
// Los servicios dependen de esta interfaz, no de una implementación.
//
// ¿Por qué existe? Una conexión WebSocket o SSE vive en UN servidor.
// Si hay varios servidores, el usuario 1 (servidor A) no puede recibir
// el mensaje del usuario 3 (servidor B). Un broker de publicación/suscripción
// (por ejemplo Redis) conecta todos los servidores:
//
//   servidor A --publish("channel:FIFA")--> broker --> servidor A, servidor B
//
// Cada servidor guarda solo SUS conexiones y entrega el mensaje localmente.

export type Unsubscribe = () => void;

export interface Broker {
  publish<T>(topic: string, payload: T): void;
  subscribe<T>(topic: string, handler: (payload: T) => void): Unsubscribe;
}
