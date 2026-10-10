import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@week14/ui/components/card";
import { SendNotificationForm } from "../features/notifications/components/SendNotificationForm";
import { useSendNotification } from "../features/notifications/hooks/useSendNotification";

export function AdminPage() {
  const { send, sending, serverErrors, message, lastSent } = useSendNotification();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enviar notificación</CardTitle>
        <CardDescription>
          Un POST normal. El servidor la reenvía por SSE a todos los que tienen abierto el feed.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {lastSent && (
          <p role="status" className="text-success text-sm">
            Enviada con id {lastSent.id}.
          </p>
        )}
        <SendNotificationForm sending={sending} serverErrors={serverErrors} message={message} onSend={send} />
      </CardContent>
    </Card>
  );
}
