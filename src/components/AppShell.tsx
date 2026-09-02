import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, Users, ScanFace, Activity, History, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useT, type TKey } from "@/lib/i18n";
import { LangToggle } from "./LangToggle";
import { cn } from "@/lib/utils";

const nav: { to: "/dashboard" | "/students" | "/scan" | "/status" | "/history"; key: TKey; icon: typeof Users }[] = [
  { to: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { to: "/students", key: "students", icon: Users },
  { to: "/scan", key: "scan", icon: ScanFace },
  { to: "/status", key: "status", icon: Activity },
  { to: "/history", key: "history", icon: History },
];

export function AppShell({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  const { t } = useT();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <h1 className="flex-1 truncate text-lg font-extrabold tracking-tight">{title}</h1>
          {action}
          <LangToggle />
          <button
            onClick={signOut}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            aria-label={t("logout")}
            title={t("logout")}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-5">
          {nav.map(({ to, key, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-muted-foreground"
              activeProps={{ className: "text-primary" }}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex h-9 w-14 items-center justify-center rounded-full transition-colors",
                      isActive && "bg-accent",
                      to === "/scan" && "bg-primary text-primary-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  {t(key)}
                </>
              )}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
