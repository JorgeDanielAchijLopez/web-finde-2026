import { dmRoom } from "@week14/protocol";
import type { Channel, ChatMessage, DirectMessage, ServerMessage } from "@week14/protocol";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { ChatSocket, type ConnectionStatus } from "../api/chatSocket";

// Lo que el usuario está viendo en la columna central.
export type ChatView = { kind: "channel"; channel: Channel } | { kind: "dm"; user: string };

export type ChatState = {
  nickname: string | null; // apodo confirmado por el servidor (welcome)
  status: ConnectionStatus;
  joined: Channel[];
  view: ChatView | null;
  channelMessages: Partial<Record<Channel, ChatMessage[]>>;
  directMessages: Record<string, DirectMessage[]>; // por sala "dm:a:b"
  presence: Partial<Record<Channel, string[]>>;
  online: string[];
  unread: Record<string, number>; // por canal o por sala de DM
  error: string | null;
};

type Action =
  | { type: "status"; status: ConnectionStatus }
  | { type: "server"; message: ServerMessage }
  | { type: "joined"; channel: Channel }
  | { type: "left"; channel: Channel }
  | { type: "view"; view: ChatView }
  | { type: "dismissError" }
  | { type: "reset"; error?: string };

const initialState: ChatState = {
  nickname: null,
  status: "closed",
  joined: [],
  view: null,
  channelMessages: {},
  directMessages: {},
  presence: {},
  online: [],
  unread: {},
  error: null,
};

// Solo guardamos los últimos mensajes de cada conversación.
const MAX_MESSAGES = 200;

// Clave de una conversación: el nombre del canal o la sala del DM.
function viewKey(state: ChatState, view: ChatView | null): string | null {
  if (!view) return null;
  if (view.kind === "channel") return view.channel;
  return state.nickname ? dmRoom(state.nickname, view.user) : null;
}

function append<T>(list: T[] | undefined, item: T): T[] {
  return [...(list ?? []), item].slice(-MAX_MESSAGES);
}

// Suma un no leído si el mensaje llega a una conversación que no está abierta.
function markUnread(state: ChatState, key: string): Record<string, number> {
  if (viewKey(state, state.view) === key) return state.unread;
  return { ...state.unread, [key]: (state.unread[key] ?? 0) + 1 };
}

function handleServerMessage(state: ChatState, message: ServerMessage): ChatState {
  switch (message.type) {
    case "welcome":
      return { ...state, nickname: message.nickname, error: null };
    case "online":
      return { ...state, online: message.users };
    case "presence":
      return { ...state, presence: { ...state.presence, [message.channel]: message.users } };
    case "message": {
      const { channel } = message.message;
      return {
        ...state,
        channelMessages: { ...state.channelMessages, [channel]: append(state.channelMessages[channel], message.message) },
        unread: markUnread(state, channel),
      };
    }
    case "dm": {
      const { room } = message.message;
      return {
        ...state,
        directMessages: { ...state.directMessages, [room]: append(state.directMessages[room], message.message) },
        unread: markUnread(state, room),
      };
    }
    case "error":
      return { ...state, error: message.message };
  }
}

function reducer(state: ChatState, action: Action): ChatState {
  switch (action.type) {
    case "status":
      return { ...state, status: action.status };
    case "server":
      return handleServerMessage(state, action.message);
    case "joined":
      return {
        ...state,
        joined: state.joined.includes(action.channel) ? state.joined : [...state.joined, action.channel],
        view: { kind: "channel", channel: action.channel },
      };
    case "left": {
      const stillViewing = state.view?.kind === "channel" && state.view.channel === action.channel;
      return {
        ...state,
        joined: state.joined.filter((channel) => channel !== action.channel),
        presence: { ...state.presence, [action.channel]: [] },
        view: stillViewing ? null : state.view,
      };
    }
    case "view": {
      const key = viewKey(state, action.view);
      const unread = { ...state.unread };
      if (key) delete unread[key];
      return { ...state, view: action.view, unread };
    }
    case "dismissError":
      return { ...state, error: null };
    case "reset":
      return { ...initialState, error: action.error ?? null };
  }
}

export function useChat() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const socketRef = useRef<ChatSocket | null>(null);

  const connect = useCallback((nickname: string) => {
    socketRef.current?.close();
    const socket = new ChatSocket(nickname, {
      onStatus: (status) => dispatch({ type: "status", status }),
      onMessage: (message) => {
        // Apodo ocupado: cerramos y volvemos al formulario con el error.
        if (message.type === "error" && message.code === "NICKNAME_TAKEN") {
          socket.close();
          dispatch({ type: "reset", error: message.message });
          return;
        }
        dispatch({ type: "server", message });
      },
    });
    socketRef.current = socket;
    socket.connect();
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
    dispatch({ type: "reset" });
  }, []);

  const join = useCallback((channel: Channel) => {
    socketRef.current?.send({ type: "join", channel });
    dispatch({ type: "joined", channel });
  }, []);

  const leave = useCallback((channel: Channel) => {
    socketRef.current?.send({ type: "leave", channel });
    dispatch({ type: "left", channel });
  }, []);

  const openView = useCallback((view: ChatView) => dispatch({ type: "view", view }), []);
  const dismissError = useCallback(() => dispatch({ type: "dismissError" }), []);

  // Envía el texto a la conversación abierta: canal o mensaje directo.
  const sendText = useCallback(
    (text: string) => {
      const view = state.view;
      if (!view) return;
      if (view.kind === "channel") {
        socketRef.current?.send({ type: "message", channel: view.channel, text });
      } else {
        socketRef.current?.send({ type: "dm", to: view.user, text });
      }
    },
    [state.view],
  );

  // Mensajes de la conversación abierta.
  const key = viewKey(state, state.view);
  const messages: (ChatMessage | DirectMessage)[] =
    state.view?.kind === "channel"
      ? (state.channelMessages[state.view.channel] ?? [])
      : key
        ? (state.directMessages[key] ?? [])
        : [];

  const unreadFor = (view: ChatView) => {
    const viewId = viewKey(state, view);
    return viewId ? (state.unread[viewId] ?? 0) : 0;
  };

  // Al desmontar el componente se cierra la conexión.
  useEffect(() => () => socketRef.current?.close(), []);

  return { state, messages, unreadFor, connect, disconnect, join, leave, openView, sendText, dismissError };
}
