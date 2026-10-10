import { Button } from "@week14/ui/components/button";
import { cn } from "@week14/ui/lib/utils";
import { Hash, Menu, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { Composer } from "./features/chat/components/Composer";
import { MemberList } from "./features/chat/components/MemberList";
import { MessageList } from "./features/chat/components/MessageList";
import { NicknameForm } from "./features/chat/components/NicknameForm";
import { Sidebar } from "./features/chat/components/Sidebar";
import { useChat, type ChatView } from "./features/chat/hooks/useChat";

// Diseño de 3 columnas estilo Discord: canales | mensajes | miembros.
// En el celular la barra lateral es un panel que se abre con el botón de menú
// y la lista de miembros se oculta.
export function App() {
  const chat = useChat();
  const { state } = chat;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!state.nickname) {
    return <NicknameForm connecting={state.status !== "closed"} serverError={state.error} onSubmit={chat.connect} />;
  }

  const me = state.nickname;
  const view = state.view;
  const members = view?.kind === "channel" ? (state.presence[view.channel] ?? []) : state.online;

  // En el celular, elegir una conversación cierra el panel.
  const openView = (next: ChatView) => {
    chat.openView(next);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Columna 1: canales y mensajes directos */}
      <aside
        className={cn(
          "bg-card fixed inset-y-0 left-0 z-40 w-72 border-r transition-transform md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Sidebar
          me={me}
          status={state.status}
          joined={state.joined}
          online={state.online}
          view={view}
          unread={chat.unreadFor}
          onOpen={openView}
          onJoin={(channel) => {
            chat.join(channel);
            setSidebarOpen(false);
          }}
          onLeave={chat.leave}
          onLogout={chat.disconnect}
        />
      </aside>
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Columna 2: conversación */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden"
            aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setSidebarOpen((open) => !open)}
          >
            {sidebarOpen ? <X /> : <Menu />}
          </Button>
          <ViewTitle view={view} />
          {view?.kind === "channel" && (
            <span className="text-muted-foreground ml-auto text-xs lg:hidden">{members.length} en el canal</span>
          )}
        </header>

        {state.error && (
          <div className="bg-destructive/15 text-destructive flex items-center gap-2 px-4 py-2 text-sm">
            <span className="flex-1">{state.error}</span>
            <Button size="sm" variant="ghost" onClick={chat.dismissError}>
              Cerrar
            </Button>
          </div>
        )}

        <div className="flex flex-1 flex-col overflow-y-auto">
          {view ? (
            <MessageList
              messages={chat.messages}
              me={me}
              emptyText={view.kind === "channel" ? "Aún no hay mensajes. ¡Salude!" : `Escríbale a ${view.user}.`}
              reactions={state.reactions}
              onReact={view.kind === "channel" ? chat.reactToMessage : undefined}
            />
          ) : (
            <p className="text-muted-foreground m-auto px-4 text-center text-sm">
              Únase a un canal o elija a alguien en "Mensajes directos".
            </p>
          )}
        </div>

        {view && (
          <Composer
            placeholder={view.kind === "channel" ? `Mensaje en #${view.channel}` : `Mensaje para ${view.user}`}
            disabled={state.status !== "open"}
            onSend={chat.sendText}
          />
        )}
      </main>

      {/* Columna 3: presencia (solo en pantallas grandes) */}
      <aside className="bg-card hidden w-60 shrink-0 overflow-y-auto border-l lg:block">
        <MemberList title={view?.kind === "channel" ? "En el canal" : "En línea"} users={members} me={me} />
      </aside>
    </div>
  );
}

function ViewTitle({ view }: { view: ChatView | null }) {
  if (!view) return <h1 className="font-semibold">Chat</h1>;
  const Icon = view.kind === "channel" ? Hash : MessageCircle;
  return (
    <h1 className="flex min-w-0 items-center gap-2 font-semibold">
      <Icon className="text-muted-foreground size-5 shrink-0" />
      <span className="truncate">{view.kind === "channel" ? view.channel : view.user}</span>
    </h1>
  );
}
