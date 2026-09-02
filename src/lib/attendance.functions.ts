import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const COOLDOWN_MS = 30_000;

const ScanInput = z.object({
  studentId: z.string().uuid(),
  snapshotPath: z.string().nullable().optional(),
});

/**
 * Records a scan for a student. Decides IN vs OUT from the last log:
 * none/OUT -> IN, IN -> OUT. Rejects re-scans within the cooldown window.
 */
export const recordScan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ScanInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: student, error: sErr } = await supabase
      .from("students")
      .select("id, name, roll_no, class_name, photo_url")
      .eq("id", data.studentId)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!student) throw new Error("Student not found");

    const { data: last, error: lErr } = await supabase
      .from("attendance_logs")
      .select("type, scanned_at")
      .eq("student_id", data.studentId)
      .order("scanned_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lErr) throw new Error(lErr.message);

    if (last && Date.now() - new Date(last.scanned_at).getTime() < COOLDOWN_MS) {
      return { status: "cooldown" as const, student, type: last.type as "IN" | "OUT", scannedAt: last.scanned_at };
    }

    const type: "IN" | "OUT" = last?.type === "IN" ? "OUT" : "IN";

    const { data: inserted, error: iErr } = await supabase
      .from("attendance_logs")
      .insert({ student_id: data.studentId, type, snapshot_url: data.snapshotPath ?? null })
      .select("scanned_at")
      .single();
    if (iErr) throw new Error(iErr.message);

    return { status: "ok" as const, student, type, scannedAt: inserted.scanned_at };
  });
