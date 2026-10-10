import { NOTIFICATION_EVENT, NotificationInputSchema, type NotificationLevel } from "@week14/protocol";
import { Button } from "@week14/ui/components/button";
import { Input } from "@week14/ui/components/input";
import { Label } from "@week14/ui/components/label";
import { Textarea } from "@week14/ui/components/textarea";
import { cn } from "@week14/ui/lib/utils";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import type { FieldErrors } from "../api/notificationsClient";

const LEVELS: { value: NotificationLevel; label: string }[] = [
  { value: "info", label: "Info" },
  { value: "success", label: "Éxito" },
  { value: "warning", label: "Aviso" },
];

type Props = {
  sending: boolean;
  serverErrors: FieldErrors;
  message: string | null;
  onSend: (input: unknown) => Promise<boolean>;
};

export function SendNotificationForm({ sending, serverErrors, message, onSend }: Props) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [level, setLevel] = useState<NotificationLevel>("info");
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});

  const input = { title, body, level };
  const errors = { ...serverErrors, ...clientErrors };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Validamos en el cliente con el MISMO esquema que usa el servidor.
    // Es solo comodidad: el servidor vuelve a validar (el cliente no es de confianza).
    const result = NotificationInputSchema.safeParse(input);
    if (!result.success) {
      setClientErrors(z.flattenError(result.error).fieldErrors);
      return;
    }
    setClientErrors({});
    if (await onSend(result.data)) {
      setTitle("");
      setBody("");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={title}
          maxLength={80}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={errors.title ? true : undefined}
          placeholder="Examen parcial publicado"
        />
        <FieldError messages={errors.title} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="body">Mensaje (opcional)</Label>
        <Textarea
          id="body"
          value={body}
          maxLength={280}
          onChange={(e) => setBody(e.target.value)}
          aria-invalid={errors.body ? true : undefined}
          placeholder="Las notas ya están en el portal."
        />
        <FieldError messages={errors.body} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Nivel</legend>
        <div className="grid grid-cols-3 gap-2">
          {LEVELS.map((option) => (
            <label
              key={option.value}
              className={cn(
                "has-focus-visible:ring-ring/50 flex cursor-pointer items-center justify-center rounded-md border py-2 text-sm has-focus-visible:ring-[3px]",
                level === option.value && "border-primary bg-primary/10 font-medium",
              )}
            >
              <input
                type="radio"
                name="level"
                value={option.value}
                checked={level === option.value}
                onChange={() => setLevel(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
        <FieldError messages={errors.level} />
      </fieldset>

      {message && <p className="text-destructive text-sm">{message}</p>}

      <Button type="submit" disabled={sending}>
        {sending ? "Enviando…" : "Enviar notificación"}
      </Button>

      <CurlPreview input={input} />
    </form>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-destructive text-xs">{messages[0]}</p>;
}

// Muestra que publicar es HTTP normal: el mismo POST funciona desde una terminal.
function CurlPreview({ input }: { input: object }) {
  const url = `${window.location.origin}/api/notifications`;
  // Escapar comillas simples para la shell: ' -> '\''
  const json = JSON.stringify(input).replaceAll("'", "'\\''");
  const command = `curl -X POST ${url} \\\n  -H "Content-Type: application/json" \\\n  -d '${json}'`;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-xs">
        Equivalente en la terminal (y para escuchar: <code>curl -N {url}</code>, eventos "{NOTIFICATION_EVENT}"):
      </p>
      <pre className="bg-muted overflow-x-auto rounded-md p-3 font-mono text-xs">{command}</pre>
    </div>
  );
}
