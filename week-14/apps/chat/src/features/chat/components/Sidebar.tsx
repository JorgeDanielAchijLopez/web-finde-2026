import { CHANNELS } from "@week14/protocol";
import type { Channel } from "@week14/protocol";
import { Badge } from "@week14/ui/components/badge";
import { Button } from "@week14/ui/components/button";
import { Separator } from "@week14/ui/components/separator";
import { cn } from "@week14/ui/lib/utils";
import { Hash, LogOut, MessageCircle } from "lucide-react";
import type { ReactNode } from "react";
import type { ConnectionStatus as Status } from "../api/chatSocket";
import type { ChatView } from "../hooks/useChat";
import { ConnectionStatus } from "./ConnectionStatus";

type SidebarProps = {
  me: string;
  status: Status;
  joined: Channel[];
  online: string[];
  view: ChatView | null;
  unread: (view: ChatView) => number;
  onOpen: (view: ChatView) => void;
  onJoin: (channel: Channel) => void;
  onLeave: (channel: Channel) => void;
  onLogout: () => void;
};

export function Sidebar(props: SidebarProps) {
  const { me, status, joined, online, view, unread, onOpen, onJoin, onLeave, onLogout } = props;
  const others = online.filter((user) => user !== me);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-3">
        <SectionTitle>Canales</SectionTitle>
        <ul className="mb-4 flex flex-col gap-1">
          {CHANNELS.map((channel) => {
            const isJoined = joined.includes(channel);
            const channelView: ChatView = { kind: "channel", channel };
            return (
              <li key={channel} className="flex items-center gap-1">
                <Item
                  active={view?.kind === "channel" && view.channel === channel}
                  muted={!isJoined}
                  unread={unread(channelView)}
                  onClick={() => (isJoined ? onOpen(channelView) : onJoin(channel))}
                >
                  <Hash className="size-4" />
                  {channel}
                </Item>
                {isJoined ? (
                  <Button size="sm" variant="ghost" onClick={() => onLeave(channel)}>
                    Salir
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => onJoin(channel)}>
                    Unirse
                  </Button>
                )}
              </li>
            );
          })}
        </ul>

        <SectionTitle>Mensajes directos</SectionTitle>
        {others.length === 0 && <p className="text-muted-foreground px-2 text-sm">Nadie más está en línea.</p>}
        <ul className="flex flex-col gap-1">
          {others.map((user) => {
            const dmView: ChatView = { kind: "dm", user };
            return (
              <li key={user}>
                <Item
                  active={view?.kind === "dm" && view.user === user}
                  unread={unread(dmView)}
                  onClick={() => onOpen(dmView)}
                >
                  <MessageCircle className="size-4" />
                  {user}
                </Item>
              </li>
            );
          })}
        </ul>
      </div>

      <Separator />
      <div className="flex items-center gap-2 p-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-sm font-semibold">{me}</span>
          <ConnectionStatus status={status} />
        </div>
        <Button size="icon" variant="ghost" onClick={onLogout} aria-label="Cerrar sesión">
          <LogOut />
        </Button>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-muted-foreground mb-2 px-2 text-xs font-semibold uppercase">{children}</h2>;
}

type ItemProps = {
  active: boolean;
  muted?: boolean;
  unread: number;
  onClick: () => void;
  children: ReactNode;
};

function Item({ active, muted, unread, onClick, children }: ItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "hover:bg-accent flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
        active && "bg-accent font-semibold",
        muted && "text-muted-foreground",
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2 truncate">{children}</span>
      {unread > 0 && <Badge>{unread}</Badge>}
    </button>
  );
}
