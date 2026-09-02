import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { AppShell } from "@/components/AppShell";
import { SignedImage } from "@/components/SignedImage";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n";
import { studentsQuery, logsForDayQuery } from "@/lib/queries";
import { TypeBadge } from "./dashboard";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "History — FaceGate" },
      { name: "description", content: "Date-wise in/out attendance history with scan photos." },
      { property: "og:title", content: "History — FaceGate" },
      { property: "og:description", content: "Date-wise in/out attendance history with scan photos." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { t } = useT();
  const [day, setDay] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [studentId, setStudentId] = useState<string>("");
  const students = useQuery(studentsQuery);
  const logs = useQuery(logsForDayQuery(day, studentId || null));
  const byId = new Map(students.data?.map((s) => [s.id, s]) ?? []);

  return (
    <AppShell title={t("history")}>
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground">{t("date")}</span>
          <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="h-11 rounded-xl" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground">{t("student")}</span>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
          >
            <option value="">{t("all")}</option>
            {students.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="mt-4 space-y-2">
        {logs.data?.length === 0 && <li className="py-10 text-center text-sm text-muted-foreground">{t("noLogs")}</li>}
        {logs.data?.map((log) => {
          const s = byId.get(log.student_id);
          return (
            <li key={log.id} className="flex items-center gap-3 rounded-2xl bg-card p-3">
              <SignedImage path={log.snapshot_url ?? s?.photo_url} alt={s?.name ?? ""} className="h-14 w-14 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{s?.name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">
                  {[s?.roll_no, s?.class_name].filter(Boolean).join(" · ")}
                </p>
                <p className="text-xs font-semibold">{format(new Date(log.scanned_at), "hh:mm:ss a")}</p>
              </div>
              <TypeBadge type={log.type} />
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
