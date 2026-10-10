import type { Notification } from "@week14/protocol";
import { useEffect, useEffectEvent, useReducer } from "react";
import { connectNotifications, type StreamStatus } from "../api/notificationsStream";

type State = { notifications: Notification[]; status: StreamStatus };

type Action =
  | { type: "received"; notification: Notification }
  | { type: "status"; status: StreamStatus };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "received": {
      // Al reconectar, el servidor puede reenviar algo que ya teníamos: descartarlo.
      // Comparamos id Y fecha: si el servidor se reinicia, los ids vuelven a empezar en 1.
      if (state.notifications.some((n) => notificationKey(n) === notificationKey(action.notification))) {
        return state;
      }
      // Más reciente primero (las fechas ISO se ordenan bien como texto).
      const notifications = [action.notification, ...state.notifications].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      );
      return { ...state, notifications };
    }
    case "status":
      return { ...state, status: action.status };
  }
}

export function notificationKey(notification: Notification): string {
  return `${notification.id}-${notification.createdAt}`;
}

// Conecta al stream mientras el componente está montado.
export function useNotifications(onReceive?: (notification: Notification) => void) {
  const [state, dispatch] = useReducer(reducer, { notifications: [], status: "connecting" });

  // useEffectEvent: siempre usa el onReceive más reciente sin reconectar cuando cambia.
  const handleReceive = useEffectEvent((notification: Notification) => onReceive?.(notification));

  useEffect(
    () =>
      connectNotifications({
        onNotification: (notification) => {
          dispatch({ type: "received", notification });
          handleReceive(notification);
        },
        onStatus: (status) => dispatch({ type: "status", status }),
      }),
    [],
  );

  return state;
}
