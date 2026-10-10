import type { Notification } from "@week14/protocol";
import { BellOff } from "lucide-react";
import { notificationKey } from "../hooks/useNotifications";
import { NotificationCard } from "./NotificationCard";

export function NotificationFeed({ notifications }: { notifications: Notification[] }) {
  if (notifications.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center text-sm">
        <BellOff className="size-6" />
        <p>Todavía no hay notificaciones.</p>
        <p>Envíe una desde la página Enviar o con curl.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {/* key estable: React solo monta (y anima) las tarjetas nuevas. */}
      {notifications.map((notification) => (
        <li key={notificationKey(notification)}>
          <NotificationCard notification={notification} />
        </li>
      ))}
    </ul>
  );
}
