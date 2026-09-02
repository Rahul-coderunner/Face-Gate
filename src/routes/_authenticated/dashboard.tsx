import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ScanFace, UserPlus, LogIn, LogOut, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useT } from "@/lib/i18n";
import { studentsQuery, latestStateQuery, todayLogsQuery } from "@/lib/queries";
import { SignedImage } from "@/components/SignedImage";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — FaceGate" },
      { name: "description", content: "Today's in/out attendance overview." },
      { property: "og:title", content: "Dashboard — FaceGate" },
      { property: "og:description", content: "Today's in/out attendance overview." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { t } = useT();
  const students = useQuery(studentsQuery);
  const latest = useQuery(latestStateQuery);
  const today = useQuery(todayLogsQuery);

  const total = students.data?.length ?? 0;
  let inside = 0;
  if (students.data && latest.data) {
    for (const s of students.data) if (latest.data.get(s.id)?.type === "IN") inside++;
  }
  const outside = total - inside;
  const byId = new Map(students.data?.map((s) => [s.id, s]) ?? []);

  return (
    <AppShell title={t("dashboard")}>
      <Link
        to="/scan"
        className="flex items-center gap-4 rounded-3xl bg-scan-bg p-5 text-scan-fg shadow-lg transition-transform active:scale-[0.98]"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <ScanFace className="h-7 w-7" />
        </span>
        <span>
          <span className="block text-lg font-extrabold">{t("startScan")}</span>
          <span className="block text-sm opacity-70">{t("lookAtCamera")}</span>
        </span>
      </Link>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label={t("total")} value={total} icon={<Users className="h-4 w-4" />} className="bg-card" />
        <Stat label={t("inside")} value={inside} icon={<LogIn className="h-4 w-4" />} className="bg-status-in text-status-in-foreground" />
        <Stat label={t("outside")} value={outside} icon={<LogOut className="h-4 w-4" />} className="bg-status-out text-status-out-foreground" />
      </div>

      <Link
        to="/students/new"
        className="mt-4 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 py-4 font-semibold text-primary"
      >
        <UserPlus className="h-5 w-5" /> {t("addStudent")}
      </Link>

      <h2 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wide text-muted-foreground">{t("todayScans")}</h2>
      <ul className="space-y-2">
        {today.data?.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">{t("noLogs")}</li>}
        {today.data?.slice(0, 20).map((log) => {
          const s = byId.get(log.student_id);
          return (
            <li key={log.id} className="flex items-center gap-3 rounded-2xl bg-card p-3">
              <SignedImage path={log.snapshot_url ?? s?.photo_url} alt={s?.name ?? ""} className="h-11 w-11 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{s?.name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(log.scanned_at), "hh:mm a")}</p>
              </div>
              <TypeBadge type={log.type} />
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}

function Stat({ label, value, icon, className }: { label: string; value: number; icon: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-4 shadow-sm ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold opacity-80">
        {icon} {label}
      </div>
      <div className="mt-1 text-3xl font-extrabold">{value}</div>
    </div>
  );
}

export function TypeBadge({ type }: { type: "IN" | "OUT" }) {
  const { t } = useT();
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-extrabold ${
        type === "IN" ? "bg-status-in text-status-in-foreground" : "bg-status-out text-status-out-foreground"
      }`}
    >
      {type === "IN" ? t("markedIn") : t("markedOut")}
    </span>
  );
}
