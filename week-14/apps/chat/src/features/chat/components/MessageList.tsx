import { useEffect, useRef } from "react";
import type { ReactionEmoji, ReactionEntry } from "@week14/protocol";

const EMOJIS: ReactionEmoji[] = ["👍", "❤️", "😂", "🔥", "👏"];

// Sirve para mensajes de canal y para mensajes directos: los dos tienen estos campos.
type ListMessage = { id: string; from: string; text: string; sentAt: string };

type MessageListProps = {
  messages: ListMessage[];
  me: string;
  emptyText: string;
  reactions: Record<string, ReactionEntry[]>;
  onReact?: (messageId: string, emoji: ReactionEmoji) => void;
};

const timeFormat = new Intl.DateTimeFormat("es-GT", { hour: "2-digit", minute: "2-digit" });

export function MessageList({ messages, me, emptyText, reactions, onReact }: MessageListProps) {
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
           {onReact && (
             <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Reacciones del mensaje">
               {EMOJIS.map((emoji) => {
                 const users = reactions[message.id]?.find((reaction) => reaction.emoji === emoji)?.users ?? [];
                 const mine = users.includes(me);
                 return (
                   <button
                     key={emoji}
                     type="button"
                     aria-label={`Reaccionar con ${emoji}`}
                     aria-pressed={mine}
                     title={users.length ? users.join(", ") : `Reaccionar con ${emoji}`}
                     onClick={() => onReact(message.id, emoji)}
                     className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-sm transition-colors ${
                       mine ? "border-indigo-400 bg-indigo-500/20" : "border-border bg-muted/30 hover:bg-muted"
                     }`}
                   >
                     <span>{emoji}</span>
                     {users.length > 0 && <span className="text-xs tabular-nums">{users.length}</span>}
                   </button>
                 );
               })}
             </div>
           )}
        </li>
      ))}
      <div ref={bottomRef} />
    </ol>
  );
}
