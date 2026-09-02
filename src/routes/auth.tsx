import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ScanFace, Lock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LangToggle } from "@/components/LangToggle";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Admin Login — FaceGate" },
      { name: "description", content: "Sign in to manage students and face attendance." },
      { property: "og:title", content: "Admin Login — FaceGate" },
      { property: "og:description", content: "Sign in to manage students and face attendance." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useT();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const email = `${username.trim().toLowerCase()}@app.local`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError(t("loginError"));
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="flex justify-end p-4">
        <LangToggle />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-lg">
            <ScanFace className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t("appName")}</h1>
          <p className="text-sm text-muted-foreground">{t("tagline")}</p>
        </div>

        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-3xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold">{t("login")}</h2>
          <div className="space-y-1.5">
            <Label htmlFor="username">{t("username")}</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="username"
                autoComplete="username"
                className="h-12 pl-9"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{t("password")}</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                className="h-12 pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          <Button type="submit" className="h-12 w-full text-base font-semibold" disabled={busy}>
            {t("loginBtn")}
          </Button>
        </form>
      </div>
    </main>
  );
}
