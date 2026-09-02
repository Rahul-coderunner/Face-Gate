import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScanFace } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FaceGate — Student In/Out Face Attendance" },
      { name: "description", content: "Face-recognition based student in/out attendance for schools. Scan a face, get marked IN or OUT automatically." },
      { property: "og:title", content: "FaceGate — Student In/Out Face Attendance" },
      { property: "og:description", content: "Face-recognition based student in/out attendance for schools." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      navigate({ to: data.session ? "/dashboard" : "/auth", replace: true });
    });
  }, [navigate]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <ScanFace className="h-8 w-8" />
      </div>
      <h1 className="text-xl font-bold">FaceGate</h1>
      <p className="text-sm text-muted-foreground">Loading…</p>
    </main>
  );
}
