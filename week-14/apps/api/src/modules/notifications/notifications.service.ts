import type { Notification, NotificationInput } from "@week14/protocol";
import type { Broker, Unsubscribe } from "../../broker/broker.ts";

// Lógica de las notificaciones. No conoce Hono ni SSE: solo datos.
// Las rutas (adaptador HTTP) llaman a estos métodos.

const TOPIC = "notifications";
// Guardamos las últimas N para reenviarlas a quien se reconecta.
const HISTORY_SIZE = 50;

export class NotificationsService {
  readonly #broker: Broker;
  #lastId = 0;
  #history: Notification[] = [];

  constructor(broker: Broker) {
    this.#broker = broker;
    // Guardamos en el historial lo que llega por el broker (de este u otro servidor).
    this.#broker.subscribe<Notification>(TOPIC, (notification) => this.#remember(notification));
  }

  publish(input: NotificationInput): Notification {
    const notification: Notification = {
      ...input,
      id: ++this.#lastId,
      createdAt: new Date().toISOString(),
    };
    // No escribimos a las conexiones directamente: el broker avisa a todos los suscriptores.
    // Con Redis, el id debería venir de Redis (INCR) para ser único entre servidores.
    this.#broker.publish(TOPIC, notification);
    return notification;
  }

  subscribe(handler: (notification: Notification) => void): Unsubscribe {
    return this.#broker.subscribe<Notification>(TOPIC, handler);
  }

  // Notificaciones posteriores a lastId (la cabecera Last-Event-ID del cliente).
  since(lastId: number): Notification[] {
    return this.#history.filter((notification) => notification.id > lastId);
  }

  #remember(notification: Notification): void {
    this.#history.push(notification);
    // Buffer circular: si pasa del límite, se descarta la más antigua.
    if (this.#history.length > HISTORY_SIZE) this.#history.shift();
  }
}
