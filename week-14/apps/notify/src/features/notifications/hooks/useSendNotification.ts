import type { Notification } from "@week14/protocol";
import { useState } from "react";
import { sendNotification, type FieldErrors } from "../api/notificationsClient";

export function useSendNotification() {
  const [sending, setSending] = useState(false);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<Notification | null>(null);

  async function send(input: unknown): Promise<boolean> {
    setSending(true);
    setMessage(null);
    const result = await sendNotification(input);
    setSending(false);

    if (result.ok) {
      setServerErrors({});
      setLastSent(result.notification);
      return true;
    }
    setServerErrors(result.errors);
    setMessage(result.message);
    return false;
  }

  return { send, sending, serverErrors, message, lastSent };
}
