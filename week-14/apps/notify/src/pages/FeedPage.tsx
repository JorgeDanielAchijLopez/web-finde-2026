import { ConnectionStatus } from "../features/notifications/components/ConnectionStatus";
import { NotificationFeed } from "../features/notifications/components/NotificationFeed";
import { SystemNotificationsButton } from "../features/notifications/components/SystemNotificationsButton";
import { useNotifications } from "../features/notifications/hooks/useNotifications";
import { useSystemNotifications } from "../features/notifications/hooks/useSystemNotifications";

export function FeedPage() {
  const system = useSystemNotifications();
  const { notifications, status } = useNotifications(system.notify);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Notificaciones en vivo</h1>
        <SystemNotificationsButton
          supported={system.supported}
          permission={system.permission}
          onEnable={system.enable}
        />
      </div>
      <ConnectionStatus status={status} />
      <NotificationFeed notifications={notifications} />
    </section>
  );
}
