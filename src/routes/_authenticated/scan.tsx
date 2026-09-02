import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { X, LogIn, LogOut, UserX, Clock } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useCamera } from "@/hooks/useCamera";
import { detectSingleFace, findBestMatch, loadFaceApi, snapshotBlob } from "@/lib/face";
import { descriptorsQuery, studentsQuery } from "@/lib/queries";
import { recordScan } from "@/lib/attendance.functions";
import { supabase } from "@/integrations/supabase/client";
import { SignedImage } from "@/components/SignedImage";
import { LangToggle } from "@/components/LangToggle";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/scan")({
  head: () => ({
    meta: [
      { title: "Scan Mode — FaceGate" },
      { name: "description", content: "Hands-free face scanning for student in/out." },
      { property: "og:title", content: "Scan Mode — FaceGate" },
      { property: "og:description", content: "Hands-free face scanning for student in/out." },
    ],
  }),
  component: ScanPage,
});

type Result =
  | { kind: "ok"; name: string; photo: string | null; type: "IN" | "OUT"; at: string }
  | { kind: "cooldown"; name: string; photo: string | null; type: "IN" | "OUT" }
  | { kind: "unknown" };

const RESULT_MS = 3000;
const UNKNOWN_MS = 1500;

function ScanPage() {
  const { t } = useT();
  const qc = useQueryClient();
  const { videoRef, ready, error } = useCamera("user");
  const descriptors = useQuery(descriptorsQuery);
  const students = useQuery(studentsQuery);
  const scan = useServerFn(recordScan);
  const [modelsReady, setModelsReady] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [faceSeen, setFaceSeen] = useState(false);
  const busyRef = useRef(false);
  const pausedUntil = useRef(0);
  const recentUnknown = useRef(0);

  useEffect(() => {
    loadFaceApi().then(() => setModelsReady(true)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!ready || !modelsReady || !descriptors.data || !students.data) return;
    let active = true;
    const byId = new Map(students.data.map((s) => [s.id, s]));

    const loop = async () => {
      while (active) {
        const video = videoRef.current;
        if (!video || video.readyState < 2 || busyRef.current || Date.now() < pausedUntil.current) {
          await new Promise((r) => setTimeout(r, 150));
          continue;
        }
        busyRef.current = true;
        try {
          const det = await detectSingleFace(video);
          setFaceSeen(!!det);
          if (det && det.score > 0.6) {
            const match = findBestMatch(det.descriptor, descriptors.data!);
            if (!match) {
              if (Date.now() - recentUnknown.current > 4000) {
                recentUnknown.current = Date.now();
                setResult({ kind: "unknown" });
                pausedUntil.current = Date.now() + UNKNOWN_MS;
                setTimeout(() => setResult((r) => (r?.kind === "unknown" ? null : r)), UNKNOWN_MS);
              }
            } else {
              const student = byId.get(match.student_id);
              let snapshotPath: string | null = null;
              const blob = await snapshotBlob(video, 320);
              if (blob) {
                snapshotPath = `scans/${match.student_id}/${Date.now()}.jpg`;
                const { error } = await supabase.storage
                  .from("faces")
                  .upload(snapshotPath, blob, { contentType: "image/jpeg" });
                if (error) snapshotPath = null;
              }
              const res = await scan({ data: { studentId: match.student_id, snapshotPath } });
              if (navigator.vibrate) navigator.vibrate(res.status === "ok" ? 80 : [40, 40, 40]);
              if (res.status === "ok") {
                setResult({ kind: "ok", name: student?.name ?? res.student.name, photo: res.student.photo_url, type: res.type, at: res.scannedAt });
                qc.invalidateQueries({ queryKey: ["logs"] });
              } else {
                setResult({ kind: "cooldown", name: res.student.name, photo: res.student.photo_url, type: res.type });
              }
              pausedUntil.current = Date.now() + RESULT_MS;
              setTimeout(() => setResult(null), RESULT_MS);
            }
          }
        } catch (e) {
          console.error(e);
          pausedUntil.current = Date.now() + 1000;
        } finally {
          busyRef.current = false;
        }
        await new Promise((r) => setTimeout(r, 120));
      }
    };
    loop();
    return () => {
      active = false;
    };
  }, [ready, modelsReady, descriptors.data, students.data, scan, qc, videoRef]);

  const loading = !ready || !modelsReady || descriptors.isLoading;

  return (
    <div className="fixed inset-0 flex flex-col bg-scan-bg text-scan-fg">
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/dashboard" className="flex h-11 items-center gap-1 rounded-full bg-scan-fg/10 px-4 text-sm font-semibold backdrop-blur">
          <X className="h-4 w-4" /> {t("exitScan")}
        </Link>
        <LangToggle className="border-scan-fg/20 bg-scan-fg/10" />
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} playsInline muted className="h-full w-full -scale-x-100 object-cover" />
        {/* Face guide */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={`relative h-[46%] w-[70%] max-w-xs rounded-[45%] border-4 transition-colors duration-300 ${
              faceSeen ? "border-status-in" : "border-scan-fg/50"
            }`}
          >
            {!result && !loading && (
              <div className="scan-line absolute inset-x-4 h-0.5 bg-status-in/80 shadow-[0_0_12px_2px_var(--status-in)]" />
            )}
          </div>
        </div>

        {/* Status pill */}
        <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center">
          <span className="rounded-full bg-scan-fg/10 px-5 py-2 text-sm font-semibold backdrop-blur">
            {error ? t("cameraError") : loading ? t("loadingModels") : faceSeen ? t("scanning") : t("lookAtCamera")}
          </span>
        </div>

        {/* Result overlay */}
        {result && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center animate-in fade-in zoom-in-95 duration-200 ${
              result.kind === "unknown"
                ? "bg-status-unknown text-status-unknown-foreground"
                : result.type === "IN"
                  ? "bg-status-in text-status-in-foreground"
                  : "bg-status-out text-status-out-foreground"
            }`}
          >
            {result.kind === "unknown" ? (
              <>
                <UserX className="h-24 w-24" />
                <h2 className="text-4xl font-extrabold">{t("unknownFace")}</h2>
                <p className="text-lg opacity-90">{t("unknownHint")}</p>
              </>
            ) : (
              <>
                <SignedImage path={result.photo} alt={result.name} className="h-32 w-32 rounded-full border-4 border-current" />
                <h2 className="text-3xl font-extrabold leading-tight">{result.name}</h2>
                <div className="flex items-center gap-3 rounded-full bg-black/15 px-6 py-3 text-4xl font-black">
                  {result.kind === "cooldown" ? (
                    <Clock className="h-9 w-9" />
                  ) : result.type === "IN" ? (
                    <LogIn className="h-9 w-9" />
                  ) : (
                    <LogOut className="h-9 w-9" />
                  )}
                  {result.type === "IN" ? t("markedIn") : t("markedOut")}
                </div>
                <p className="text-lg font-semibold opacity-90">
                  {result.kind === "cooldown"
                    ? t("tooSoon")
                    : `${result.type === "IN" ? t("welcome") : t("goodbye")} · ${format(new Date(result.at), "hh:mm a")}`}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
