type MemberListProps = {
  title: string;
  users: string[];
  me: string;
};

// Presencia: quién está en el canal ahora mismo (la envía el servidor).
export function MemberList({ title, users, me }: MemberListProps) {
  return (
    <div className="flex flex-col gap-2 p-4">
      <h2 className="text-muted-foreground text-xs font-semibold uppercase">
        {title} — {users.length}
      </h2>
      <ul className="flex flex-col gap-1">
        {users.map((user) => (
          <li key={user} className="flex items-center gap-2 text-sm">
            <span className="bg-success size-2 rounded-full" aria-hidden />
            <span className="truncate">{user}</span>
            {user === me && <span className="text-muted-foreground text-xs">(usted)</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
