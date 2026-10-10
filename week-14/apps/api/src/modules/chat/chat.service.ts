import { CHANNELS, dmRoom } from "@week14/protocol";
import type { Channel, ClientMessage, ErrorCode, ServerMessage } from "@week14/protocol";
import type { Broker, Unsubscribe } from "../../broker/broker.ts";
import type { ChatConnection } from "./chat.connection.ts";

// Datos de una conexión que ya envió "hello".
type Session = {
  nickname: string;
  channels: Set<Channel>;
  unsubscribeUser: Unsubscribe;
};

// Tópicos del broker. Un mensaje se publica en un tópico y le llega
// a cada servidor suscrito a ese tópico (aquí solo hay uno, en memoria).
const channelTopic = (channel: Channel) => `channel:${channel}`;
const userTopic = (nickname: string) => `user:${nickname}`;

export class ChatService {
  readonly #broker: Broker;

  // ---------- Estado LOCAL de este servidor ----------
  // Importante: WebSocket NO tiene canales, salas ni "broadcast".
  // Solo existe "enviar un mensaje a UNA conexión". Los canales son
  // este Map de nuestro código: canal -> apodos conectados aquí.
  readonly #channels = new Map<Channel, Set<string>>();
  readonly #connections = new Map<string, ChatConnection>(); // apodo -> conexión
  readonly #sessions = new Map<ChatConnection, Session>();
  // Suscripciones de este servidor a los tópicos "channel:<nombre>".
  readonly #channelSubscriptions = new Map<Channel, Unsubscribe>();

  constructor(broker: Broker) {
    this.#broker = broker;
  }

  // Punto de entrada: las rutas ya validaron el mensaje con Zod.
  handle(connection: ChatConnection, message: ClientMessage): void {
    if (message.type === "hello") {
      this.#hello(connection, message.nickname);
      return;
    }

    // Todo lo demás exige que la conexión tenga apodo.
    const session = this.#sessions.get(connection);
    if (!session) {
      sendError(connection, "NOT_IDENTIFIED", "Primero envíe un mensaje hello con su apodo");
      return;
    }

    switch (message.type) {
      case "join":
        return this.#join(session, message.channel);
      case "leave":
        return this.#leave(session, message.channel);
      case "message":
        return this.#message(connection, session, message.channel, message.text);
      case "dm":
        return this.#directMessage(connection, session, message.to, message.text);
    }
  }

  // La conexión se cerró (el usuario salió, perdió la red o no respondió al ping).
  disconnect(connection: ChatConnection): void {
    const session = this.#sessions.get(connection);
    if (!session) return; // nunca se identificó: no hay nada que limpiar

    for (const channel of [...session.channels]) {
      this.#leave(session, channel);
    }
    session.unsubscribeUser();
    this.#sessions.delete(connection);
    this.#connections.delete(session.nickname);

    console.log(`[chat] ${session.nickname} se desconectó (${this.#connections.size} en línea)`);
    this.#broadcastOnline();
  }

  #hello(connection: ChatConnection, nickname: string): void {
    if (this.#sessions.has(connection)) {
      sendError(connection, "INVALID_MESSAGE", "Esta conexión ya tiene apodo");
      return;
    }
    if (this.#connections.has(nickname)) {
      sendError(connection, "NICKNAME_TAKEN", `El apodo "${nickname}" ya está en uso`);
      return;
    }

    // Cada usuario escucha su propio tópico para recibir mensajes directos.
    const unsubscribeUser = this.#broker.subscribe<ServerMessage>(userTopic(nickname), (payload) => {
      this.#connections.get(nickname)?.send(payload);
    });

    this.#sessions.set(connection, { nickname, channels: new Set(), unsubscribeUser });
    this.#connections.set(nickname, connection);

    console.log(`[chat] ${nickname} se conectó (${this.#connections.size} en línea)`);
    connection.send({ type: "welcome", nickname, channels: [...CHANNELS] });
    this.#broadcastOnline();
  }

  #join(session: Session, channel: Channel): void {
    const members = this.#channels.get(channel) ?? new Set<string>();
    this.#channels.set(channel, members);

    // Primer miembro local: este servidor empieza a escuchar el canal en el broker.
    if (members.size === 0) {
      const unsubscribe = this.#broker.subscribe<ServerMessage>(channelTopic(channel), (payload) => {
        this.#deliverToChannel(channel, payload);
      });
      this.#channelSubscriptions.set(channel, unsubscribe);
    }

    members.add(session.nickname);
    session.channels.add(channel);
    this.#sendPresence(channel);
  }

  #leave(session: Session, channel: Channel): void {
    const members = this.#channels.get(channel);
    if (!members?.has(session.nickname)) return; // no estaba en el canal

    members.delete(session.nickname);
    session.channels.delete(channel);

    // Último miembro local: ya no hace falta escuchar ese tópico.
    if (members.size === 0) {
      this.#channelSubscriptions.get(channel)?.();
      this.#channelSubscriptions.delete(channel);
      this.#channels.delete(channel);
    }
    this.#sendPresence(channel);
  }

  #message(connection: ChatConnection, session: Session, channel: Channel, text: string): void {
    if (!session.channels.has(channel)) {
      sendError(connection, "NOT_IN_CHANNEL", `Únase a ${channel} antes de escribir`);
      return;
    }

    // No enviamos directo a los sockets: publicamos en el broker.
    // Así, con varios servidores, los miembros conectados a otro servidor también lo reciben.
    // El remitente también recibe su mensaje (eco): esa es la confirmación
    // de que el servidor lo aceptó y lo distribuyó.
    this.#broker.publish<ServerMessage>(channelTopic(channel), {
      type: "message",
      message: {
        id: crypto.randomUUID(),
        channel,
        from: session.nickname,
        text,
        sentAt: new Date().toISOString(),
      },
    });
  }

  #directMessage(connection: ChatConnection, session: Session, to: string, text: string): void {
    // Con varios servidores, esta verificación necesitaría un registro compartido
    // de usuarios en línea (por ejemplo en Redis). Aquí basta el Map local.
    if (!this.#connections.has(to)) {
      sendError(connection, "USER_NOT_FOUND", `${to} no está en línea`);
      return;
    }

    const from = session.nickname;
    const payload: ServerMessage = {
      type: "dm",
      message: {
        id: crypto.randomUUID(),
        room: dmRoom(from, to), // mismo nombre de sala para los dos usuarios
        from,
        to,
        text,
        sentAt: new Date().toISOString(),
      },
    };

    // Se publica al destinatario y al remitente (eco). El Set evita
    // duplicar el mensaje si alguien se escribe a sí mismo.
    for (const nickname of new Set([to, from])) {
      this.#broker.publish(userTopic(nickname), payload);
    }
  }

  // Handler del broker: entrega a los miembros del canal conectados a ESTE servidor.
  #deliverToChannel(channel: Channel, payload: ServerMessage): void {
    for (const nickname of this.#channels.get(channel) ?? []) {
      this.#connections.get(nickname)?.send(payload);
    }
  }

  // Presencia del canal. Para simplificar se envía solo a las conexiones locales;
  // con varios servidores la presencia también necesitaría un almacén compartido.
  #sendPresence(channel: Channel): void {
    const users = [...(this.#channels.get(channel) ?? [])].sort();
    this.#deliverToChannel(channel, { type: "presence", channel, users });
  }

  // Lista global de usuarios en línea (la usa el frontend para los mensajes directos).
  #broadcastOnline(): void {
    const users = [...this.#connections.keys()].sort();
    for (const connection of this.#connections.values()) {
      connection.send({ type: "online", users });
    }
  }
}

function sendError(connection: ChatConnection, code: ErrorCode, message: string): void {
  connection.send({ type: "error", code, message });
}
