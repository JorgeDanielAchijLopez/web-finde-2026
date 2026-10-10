import type { Notification, NotificationLevel } from "@week14/protocol";
import { Badge } from "@week14/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@week14/ui/components/card";

const LEVELS: Record<NotificationLevel, { label: string; variant: "secondary" | "success" | "warning" }> = {
  info: { label: "Info", variant: "secondary" },
  success: { label: "Éxito", variant: "success" },
  warning: { label: "Aviso", variant: "warning" },
};

const timeFormat = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export function NotificationCard({ notification }: { notification: Notification }) {
  const level = LEVELS[notification.level];

  return (
    // animate-in: entra deslizándose desde arriba cuando React la monta.
    <Card className="animate-in fade-in slide-in-from-top-2 gap-2 py-4 duration-300">
      <CardHeader className="flex items-center gap-2 px-4">
        <Badge variant={level.variant}>{level.label}</Badge>
        <CardTitle className="min-w-0 flex-1 truncate">{notification.title}</CardTitle>
        <time dateTime={notification.createdAt} className="text-muted-foreground shrink-0 text-xs tabular-nums">
          {timeFormat.format(new Date(notification.createdAt))}
        </time>
      </CardHeader>
      {notification.body && (
        <CardContent className="text-muted-foreground px-4 text-sm break-words whitespace-pre-line">
          {notification.body}
        </CardContent>
      )}
      <p className="text-muted-foreground/70 px-4 font-mono text-[11px]">id: {notification.id}</p>
    </Card>
  );
}
