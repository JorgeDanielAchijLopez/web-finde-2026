import { Badge } from "@week14/ui/components/badge";
import type { ConnectionStatus as Status } from "../api/chatSocket";

const LABELS: Record<Status, { text: string; variant: "success" | "warning" | "destructive" }> = {
  open: { text: "Conectado", variant: "success" },
  connecting: { text: "Conectando...", variant: "warning" },
  closed: { text: "Desconectado", variant: "destructive" },
};

export function ConnectionStatus({ status }: { status: Status }) {
  const { text, variant } = LABELS[status];
  return <Badge variant={variant}>{text}</Badge>;
}
