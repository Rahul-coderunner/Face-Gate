CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  roll_no TEXT NOT NULL DEFAULT '',
  class_name TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage students" ON public.students FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.face_descriptors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  descriptor REAL[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX face_descriptors_student_idx ON public.face_descriptors(student_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.face_descriptors TO authenticated;
GRANT ALL ON public.face_descriptors TO service_role;
ALTER TABLE public.face_descriptors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage descriptors" ON public.face_descriptors FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('IN','OUT')),
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  snapshot_url TEXT
);
CREATE INDEX attendance_logs_student_time_idx ON public.attendance_logs(student_id, scanned_at DESC);
CREATE INDEX attendance_logs_time_idx ON public.attendance_logs(scanned_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_logs TO authenticated;
GRANT ALL ON public.attendance_logs TO service_role;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage logs" ON public.attendance_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);