import { cn } from "@week14/ui/lib/utils";
import type { StreamStatus } from "../api/notificationsStream";

const STATUS: Record<StreamStatus, { label: string; dot: string }> = {
  connecting: { label: "Conectando…", dot: "bg-warning animate-pulse" },
  open: { label: "Conectado", dot: "bg-success" },
  reconnecting: { label: "Reconectando…", dot: "bg-warning animate-pulse" },
  closed: { label: "Desconectado", dot: "bg-destructive" },
};

export function ConnectionStatus({ status }: { status: StreamStatus }) {
  const { label, dot } = STATUS[status];

  return (
    <div className="bg-muted/50 flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm">
      {/* role="status": los lectores de pantalla anuncian el cambio. */}
      <p role="status" className="flex items-center gap-2 font-medium">
        <span className={cn("size-2.5 rounded-full", dot)} />
        {label}
      </p>
      <p className="text-muted-foreground text-xs">
        Pruebe: detenga el servidor y vea cómo EventSource reconecta solo. Al reconectar envía
        Last-Event-ID y el servidor reenvía lo perdido (si el servidor siguió vivo, por ejemplo al
        cortar el Wi-Fi del teléfono).
      </p>
    </div>
  );
}
