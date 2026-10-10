import { cn } from "@week14/ui/lib/utils";
import { Bell } from "lucide-react";
import { NavLink, Route, Routes } from "react-router";
import { AdminPage } from "./pages/AdminPage";
import { FeedPage } from "./pages/FeedPage";

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
  );

export function App() {
  return (
    <div className="bg-background min-h-dvh">
      <header className="bg-background/90 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3">
          <span className="flex items-center gap-2 font-semibold">
            <Bell className="size-5" /> SSE
          </span>
          <nav className="flex gap-1">
            {/* end: "/" solo queda activo en la ruta exacta. */}
            <NavLink to="/" end className={navClass}>
              Feed
            </NavLink>
            <NavLink to="/admin" className={navClass}>
              Enviar
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  );
}
