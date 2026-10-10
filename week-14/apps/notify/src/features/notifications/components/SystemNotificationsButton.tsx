import { Button } from "@week14/ui/components/button";
import { BellRing } from "lucide-react";

// Opcional: pedir permiso para notificaciones del sistema.
type Props = { supported: boolean; permission: NotificationPermission; onEnable: () => void };

export function SystemNotificationsButton({ supported, permission, onEnable }: Props) {
  if (!supported || permission === "denied") return null;
  if (permission === "granted") {
    return <p className="text-muted-foreground text-xs">Avisos del sistema activos (con la pestaña oculta).</p>;
  }
  return (
    <Button variant="outline" size="sm" onClick={onEnable}>
      <BellRing />
      Avisarme con la pestaña oculta
    </Button>
  );
}
