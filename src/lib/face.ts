// Browser-only face engine wrapper around @vladmandic/face-api.
// Always dynamically imported so SSR never evaluates TensorFlow.

type FaceApi = typeof import("@vladmandic/face-api");

let api: FaceApi | null = null;
let loading: Promise<FaceApi> | null = null;

export async function loadFaceApi(): Promise<FaceApi> {
  if (api) return api;
  if (!loading) {
    loading = (async () => {
      const mod = await import("@vladmandic/face-api");
      await (mod.tf as unknown as { ready?: () => Promise<void> }).ready?.();
      await Promise.all([
        mod.nets.tinyFaceDetector.loadFromUri("/models"),
        mod.nets.faceLandmark68TinyNet.loadFromUri("/models"),
        mod.nets.faceRecognitionNet.loadFromUri("/models"),
      ]);
      api = mod;
      return mod;
    })();
  }
  return loading;
}

export type DetectResult = {
  descriptor: Float32Array;
  box: { x: number; y: number; width: number; height: number };
  score: number;
};

export async function detectSingleFace(
  input: HTMLVideoElement | HTMLCanvasElement,
): Promise<DetectResult | null> {
  const f = await loadFaceApi();
  const opts = new f.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
  const res = await f
    .detectSingleFace(input, opts)
    .withFaceLandmarks(true)
    .withFaceDescriptor();
  if (!res) return null;
  const b = res.detection.box;
  return {
    descriptor: res.descriptor,
    box: { x: b.x, y: b.y, width: b.width, height: b.height },
    score: res.detection.score,
  };
}

export function euclidean(a: ArrayLike<number>, b: ArrayLike<number>) {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i]! - b[i]!;
    s += d * d;
  }
  return Math.sqrt(s);
}

export const MATCH_THRESHOLD = 0.5;

export function findBestMatch(
  descriptor: ArrayLike<number>,
  samples: { student_id: string; descriptor: number[] }[],
) {
  let best: { student_id: string; distance: number } | null = null;
  for (const s of samples) {
    const d = euclidean(descriptor, s.descriptor);
    if (!best || d < best.distance) best = { student_id: s.student_id, distance: d };
  }
  if (best && best.distance <= MATCH_THRESHOLD) return best;
  return null;
}

/** Grab a JPEG blob of the current video frame. */
export function snapshotBlob(video: HTMLVideoElement, maxW = 480): Promise<Blob | null> {
  const scale = Math.min(1, maxW / video.videoWidth);
  const c = document.createElement("canvas");
  c.width = Math.round(video.videoWidth * scale);
  c.height = Math.round(video.videoHeight * scale);
  const ctx = c.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.drawImage(video, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob((b) => res(b), "image/jpeg", 0.8));
}
