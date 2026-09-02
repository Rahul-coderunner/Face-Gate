import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { SignedImage } from "@/components/SignedImage";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n";
import { studentsQuery, descriptorsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/students/")({
  head: () => ({
    meta: [
      { title: "Students — FaceGate" },
      { name: "description", content: "Manage registered students and their face samples." },
      { property: "og:title", content: "Students — FaceGate" },
      { property: "og:description", content: "Manage registered students and their face samples." },
    ],
  }),
  component: StudentsPage,
});

function StudentsPage() {
  const { t } = useT();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const students = useQuery(studentsQuery);
  const descriptors = useQuery(descriptorsQuery);

  const counts = new Map<string, number>();
  descriptors.data?.forEach((d) => counts.set(d.student_id, (counts.get(d.student_id) ?? 0) + 1));

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["descriptors"] });
      qc.invalidateQueries({ queryKey: ["logs"] });
    },
    onError: () => toast.error(t("error")),
  });

  const list = (students.data ?? []).filter(
    (s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.roll_no.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AppShell
      title={t("students")}
      action={
        <Link
          to="/students/new"
          className="flex h-9 items-center gap-1 rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> {t("addStudent")}
        </Link>
      }
    >
      <Input placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} className="h-11 rounded-xl" />
      <ul className="mt-3 space-y-2">
        {students.data?.length === 0 && (
          <li className="py-12 text-center text-sm text-muted-foreground">{t("noStudents")}</li>
        )}
        {list.map((s) => (
          <li key={s.id} className="flex items-center gap-3 rounded-2xl bg-card p-3">
            <SignedImage path={s.photo_url} alt={s.name} className="h-12 w-12 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{s.name}</p>
              <p className="text-xs text-muted-foreground">
                {[s.roll_no, s.class_name].filter(Boolean).join(" · ")} · {counts.get(s.id) ?? 0} {t("faces")}
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm(t("confirmDelete"))) del.mutate(s.id);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label={t("delete")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
