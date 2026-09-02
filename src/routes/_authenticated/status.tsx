import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { AppShell } from "@/components/AppShell";
import { SignedImage } from "@/components/SignedImage";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n";
import { studentsQuery, latestStateQuery } from "@/lib/queries";
import { TypeBadge } from "./dashboard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/status")({
  head: () => ({
    meta: [
      { title: "Live Status — FaceGate" },
      { name: "description", content: "Who is currently inside or outside." },
      { property: "og:title", content: "Live Status — FaceGate" },
      { property: "og:description", content: "Who is currently inside or outside." },
    ],
  }),
  component: StatusPage,
});

type Filter = "all" | "IN" | "OUT";

function StatusPage() {
  const { t } = useT();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const students = useQuery(studentsQuery);
  const latest = useQuery({ ...latestStateQuery, refetchInterval: 10_000 });

  const rows = (students.data ?? [])
    .map((s) => ({ s, state: latest.data?.get(s.id) }))
    .filter(({ s }) => s.name.toLowerCase().includes(q.toLowerCase()))
    .filter(({ state }) => {
      if (filter === "all") return true;
      const type = state?.type ?? "OUT";
      return type === filter;
    });

  const inside = (students.data ?? []).filter((s) => latest.data?.get(s.id)?.type === "IN").length;
  const total = students.data?.length ?? 0;

  return (
    <AppShell title={t("status")}>
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ["all", t("all"), total],
            ["IN", t("inside"), inside],
            ["OUT", t("outside"), total - inside],
          ] as const
        ).map(([key, label, n]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-2xl border p-3 text-left transition-colors",
              filter === key
                ? key === "IN"
                  ? "border-status-in bg-status-in text-status-in-foreground"
                  : key === "OUT"
                    ? "border-status-out bg-status-out text-status-out-foreground"
                    : "border-primary bg-primary text-primary-foreground"
                : "bg-card",
            )}
          >
            <div className="text-xs font-semibold opacity-80">{label}</div>
            <div className="text-2xl font-extrabold">{n}</div>
          </button>
        ))}
      </div>
      <Input placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} className="mt-3 h-11 rounded-xl" />
      <ul className="mt-3 space-y-2">
        {rows.length === 0 && <li className="py-10 text-center text-sm text-muted-foreground">{t("noLogs")}</li>}
        {rows.map(({ s, state }) => (
          <li key={s.id} className="flex items-center gap-3 rounded-2xl bg-card p-3">
            <SignedImage path={s.photo_url} alt={s.name} className="h-12 w-12 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{s.name}</p>
              <p className="text-xs text-muted-foreground">
                {state ? `${t("lastSeen")}: ${format(new Date(state.scanned_at), "dd MMM, hh:mm a")}` : t("notScanned")}
              </p>
            </div>
            {state ? <TypeBadge type={state.type} /> : <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">—</span>}
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
