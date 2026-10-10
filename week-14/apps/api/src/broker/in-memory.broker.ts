import type { Broker, Unsubscribe } from "./broker.ts";

// Adaptador (adapter) en memoria: funciona con UN solo proceso.
// Para varios servidores, cree redis.broker.ts con la misma interfaz
// y cambie una línea en main.ts. Los servicios no cambian.
export class InMemoryBroker implements Broker {
  #handlers = new Map<string, Set<(payload: unknown) => void>>();

  publish<T>(topic: string, payload: T): void {
    for (const handler of this.#handlers.get(topic) ?? []) {
      handler(payload);
    }
  }

  subscribe<T>(topic: string, handler: (payload: T) => void): Unsubscribe {
    const handlers = this.#handlers.get(topic) ?? new Set();
    const wrapped = handler as (payload: unknown) => void;
    handlers.add(wrapped);
    this.#handlers.set(topic, handlers);

    return () => {
      handlers.delete(wrapped);
      if (handlers.size === 0) this.#handlers.delete(topic);
    };
  }
}
