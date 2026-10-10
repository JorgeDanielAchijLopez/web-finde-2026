import { useEffect, useRef } from "react";

// Sirve para mensajes de canal y para mensajes directos: los dos tienen estos campos.
type ListMessage = { id: string; from: string; text: string; sentAt: string };

type MessageListProps = {
  messages: ListMessage[];
  me: string;
  emptyText: string;
};

const timeFormat = new Intl.DateTimeFormat("es-GT", { hour: "2-digit", minute: "2-digit" });

export function MessageList({ messages, me, emptyText }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Cada mensaje nuevo baja el scroll hasta el final.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  if (messages.length === 0) {
    return <p className="text-muted-foreground m-auto px-4 text-center text-sm">{emptyText}</p>;
  }

  return (
    <ol className="flex flex-col gap-3 p-4">
      {messages.map((message) => (
        <li key={message.id} className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className={message.from === me ? "text-primary font-semibold" : "font-semibold"}>
              {message.from}
            </span>
            <time className="text-muted-foreground text-xs" dateTime={message.sentAt}>
              {timeFormat.format(new Date(message.sentAt))}
            </time>
          </div>
          {/* React escapa el texto: si alguien envía "<script>", se muestra como texto
              y no se ejecuta. Por eso nunca usamos dangerouslySetInnerHTML (XSS). */}
          <p className="break-words whitespace-pre-wrap">{message.text}</p>
        </li>
      ))}
      <div ref={bottomRef} />
    </ol>
  );
}
