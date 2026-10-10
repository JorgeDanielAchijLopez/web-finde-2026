import type { Notification } from "@week14/protocol";
import { useState } from "react";

// Opcional: notificaciones del sistema operativo con la Notification API.
// Solo las mostramos si la pestaña está oculta (si está visible, ya se ve el feed).

const supported = typeof window !== "undefined" && "Notification" in window;

export function useSystemNotifications() {
  const [permission, setPermission] = useState(supported ? window.Notification.permission : "denied");

  async function enable() {
    if (supported) setPermission(await window.Notification.requestPermission());
  }

  function notify(notification: Notification) {
    if (permission === "granted" && document.visibilityState === "hidden") {
      new window.Notification(notification.title, { body: notification.body, tag: String(notification.id) });
    }
  }

  return { supported, permission, enable, notify };
}
