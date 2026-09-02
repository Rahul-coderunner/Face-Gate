import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Camera, Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n";
import { useCamera } from "@/hooks/useCamera";
import { detectSingleFace, loadFaceApi, snapshotBlob } from "@/lib/face";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/students/new")({
  head: () => ({
    meta: [
      { title: "Register Student — FaceGate" },
      { name: "description", content: "Add a new student and capture face samples." },
      { property: "og:title", content: "Register Student — FaceGate" },
      { property: "og:description", content: "Add a new student and capture face samples." },
    ],
  }),
  component: NewStudent,
});

const MIN_SAMPLES = 3;
const MAX_SAMPLES = 5;

function NewStudent() {
  const { t } = useT();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [className, setClassName] = useState("");
  const [samples, setSamples] = useState<{ descriptor: number[]; blob: Blob }[]>([]);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const { data: student, error } = await supabase
        .from("students")
        .insert({ name: name.trim(), roll_no: rollNo.trim(), class_name: className.trim() })
        .select("id")
        .single();
      if (error) throw error;

      const first = samples[0]!;
      const photoPath = `students/${student.id}/profile.jpg`;
      const { error: upErr } = await supabase.storage
        .from("faces")
        .upload(photoPath, first.blob, { contentType: "image/jpeg", upsert: true });
      if (upErr) throw upErr;
      await supabase.from("students").update({ photo_url: photoPath }).eq("id", student.id);

      const { error: dErr } = await supabase
        .from("face_descriptors")
        .insert(samples.map((s) => ({ student_id: student.id, descriptor: s.descriptor })));
      if (dErr) throw dErr;

      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["descriptors"] });
      toast.success(t("saved"));
      navigate({ to: "/students" });
    } catch (e) {
      console.error(e);
      toast.error(t("error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title={t("addStudent")}>
      {step === 1 && (
        <form
          className="space-y-4 rounded-3xl bg-card p-5"
          onSubmit={(e) => {
            e.preventDefault();
            setStep(2);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("name")}</Label>
            <Input id="name" className="h-12" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="roll">{t("rollNo")}</Label>
              <Input id="roll" className="h-12" value={rollNo} onChange={(e) => setRollNo(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cls">{t("className")}</Label>
              <Input id="cls" className="h-12" value={className} onChange={(e) => setClassName(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="h-12 w-full text-base font-semibold">
            {t("next")} <Camera className="ml-1 h-4 w-4" />
          </Button>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm font-semibold text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> {t("back")}
          </button>
          <div className="rounded-3xl bg-card p-4">
            <h2 className="font-bold">{t("captureFace")} — {name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("captureHint")}</p>
          </div>
          <CaptureBox
            disabled={busy || samples.length >= MAX_SAMPLES}
            onCapture={async (video) => {
              setBusy(true);
              try {
                const res = await detectSingleFace(video);
                if (!res) {
                  toast.error(t("noFace"));
                  return;
                }
                const blob = await snapshotBlob(video);
                if (!blob) return;
                setSamples((s) => [...s, { descriptor: Array.from(res.descriptor), blob }]);
              } finally {
                setBusy(false);
              }
            }}
          />
          <div className="flex items-center justify-between rounded-2xl bg-card px-4 py-3">
            <div className="flex gap-1.5">
              {Array.from({ length: MAX_SAMPLES }).map((_, i) => (
                <span
                  key={i}
                  className={`h-3 w-3 rounded-full ${i < samples.length ? "bg-status-in" : "bg-muted"}`}
                />
              ))}
            </div>
            <span className="text-sm font-semibold">
              {samples.length}/{MAX_SAMPLES} {t("captured")}
            </span>
          </div>
          <Button
            className="h-12 w-full text-base font-semibold"
            disabled={samples.length < MIN_SAMPLES || saving}
            onClick={save}
          >
            <Check className="mr-1 h-4 w-4" /> {saving ? t("saving") : t("save")}
          </Button>
        </div>
      )}
    </AppShell>
  );
}

function CaptureBox({ onCapture, disabled }: { onCapture: (v: HTMLVideoElement) => Promise<void>; disabled: boolean }) {
  const { t } = useT();
  const { videoRef, ready, error } = useCamera("user");
  const [modelsReady, setModelsReady] = useState(false);
  useEffect(() => {
    loadFaceApi().then(() => setModelsReady(true)).catch(console.error);
  }, []);

  return (
    <div className="overflow-hidden rounded-3xl bg-scan-bg text-scan-fg">
      <div className="relative aspect-[3/4] w-full">
        <video ref={videoRef} playsInline muted className="h-full w-full -scale-x-100 object-cover" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[62%] w-[70%] rounded-[45%] border-4 border-scan-fg/60" />
        </div>
        {(!ready || !modelsReady) && !error && (
          <div className="absolute inset-x-0 bottom-3 text-center text-xs opacity-80">{t("loadingModels")}</div>
        )}
        {error && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm">{t("cameraError")}</div>}
      </div>
      <div className="p-3">
        <Button
          variant="secondary"
          className="h-12 w-full text-base font-semibold"
          disabled={disabled || !ready || !modelsReady}
          onClick={() => videoRef.current && onCapture(videoRef.current)}
        >
          <Camera className="mr-1 h-5 w-5" /> {t("capture")}
        </Button>
      </div>
    </div>
  );
}
