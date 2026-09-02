import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Student = {
  id: string;
  name: string;
  roll_no: string;
  class_name: string;
  photo_url: string | null;
  created_at: string;
};

export type Log = {
  id: string;
  student_id: string;
  type: "IN" | "OUT";
  scanned_at: string;
  snapshot_url: string | null;
};

export const studentsQuery = queryOptions({
  queryKey: ["students"],
  queryFn: async () => {
    const { data, error } = await supabase.from("students").select("*").order("name");
    if (error) throw error;
    return data as Student[];
  },
});

export const descriptorsQuery = queryOptions({
  queryKey: ["descriptors"],
  staleTime: 5 * 60 * 1000,
  queryFn: async () => {
    const { data, error } = await supabase.from("face_descriptors").select("student_id, descriptor");
    if (error) throw error;
    return data as { student_id: string; descriptor: number[] }[];
  },
});

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const todayLogsQuery = queryOptions({
  queryKey: ["logs", "today"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("attendance_logs")
      .select("*")
      .gte("scanned_at", startOfToday().toISOString())
      .order("scanned_at", { ascending: false });
    if (error) throw error;
    return data as Log[];
  },
});

/** Latest log per student (all time) to determine current inside/outside state. */
export const latestStateQuery = queryOptions({
  queryKey: ["logs", "latest"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("attendance_logs")
      .select("student_id, type, scanned_at")
      .order("scanned_at", { ascending: false })
      .limit(5000);
    if (error) throw error;
    const map = new Map<string, { type: "IN" | "OUT"; scanned_at: string }>();
    for (const row of data) {
      if (!map.has(row.student_id)) map.set(row.student_id, { type: row.type as "IN" | "OUT", scanned_at: row.scanned_at });
    }
    return map;
  },
});

export const logsForDayQuery = (day: string, studentId: string | null) =>
  queryOptions({
    queryKey: ["logs", "day", day, studentId],
    queryFn: async () => {
      const start = new Date(day + "T00:00:00");
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      let q = supabase
        .from("attendance_logs")
        .select("*")
        .gte("scanned_at", start.toISOString())
        .lt("scanned_at", end.toISOString())
        .order("scanned_at", { ascending: false });
      if (studentId) q = q.eq("student_id", studentId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Log[];
    },
  });
