import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "mr";

const dict = {
  appName: { en: "FaceGate", mr: "फेसगेट" },
  tagline: { en: "Student In/Out Attendance", mr: "विद्यार्थी आत/बाहेर हजेरी" },
  login: { en: "Login", mr: "लॉगिन" },
  username: { en: "Username", mr: "वापरकर्तानाव" },
  password: { en: "Password", mr: "पासवर्ड" },
  loginBtn: { en: "Sign in", mr: "साइन इन करा" },
  loginError: { en: "Wrong username or password", mr: "चुकीचे वापरकर्तानाव किंवा पासवर्ड" },
  logout: { en: "Logout", mr: "लॉगआउट" },
  dashboard: { en: "Dashboard", mr: "डॅशबोर्ड" },
  students: { en: "Students", mr: "विद्यार्थी" },
  scan: { en: "Scan", mr: "स्कॅन" },
  status: { en: "Live Status", mr: "सद्यस्थिती" },
  history: { en: "History", mr: "इतिहास" },
  total: { en: "Total students", mr: "एकूण विद्यार्थी" },
  inside: { en: "Inside", mr: "आत" },
  outside: { en: "Outside", mr: "बाहेर" },
  todayScans: { en: "Today's scans", mr: "आजचे स्कॅन" },
  startScan: { en: "Start Scan Mode", mr: "स्कॅन मोड सुरू करा" },
  addStudent: { en: "Add student", mr: "विद्यार्थी जोडा" },
  name: { en: "Full name", mr: "पूर्ण नाव" },
  rollNo: { en: "Roll no.", mr: "रोल नं." },
  className: { en: "Class", mr: "वर्ग" },
  next: { en: "Next", mr: "पुढे" },
  back: { en: "Back", mr: "मागे" },
  captureFace: { en: "Capture face", mr: "चेहरा टिपा" },
  captureHint: {
    en: "Take 3–5 photos from slightly different angles. Face should be clearly visible.",
    mr: "थोड्या वेगळ्या कोनातून ३–५ फोटो घ्या. चेहरा स्पष्ट दिसला पाहिजे.",
  },
  capture: { en: "Capture", mr: "फोटो घ्या" },
  captured: { en: "captured", mr: "टिपले" },
  noFace: { en: "No face detected. Try again.", mr: "चेहरा सापडला नाही. पुन्हा प्रयत्न करा." },
  save: { en: "Save student", mr: "विद्यार्थी जतन करा" },
  saving: { en: "Saving…", mr: "जतन करत आहे…" },
  saved: { en: "Student registered!", mr: "विद्यार्थी नोंदणी झाली!" },
  loadingModels: { en: "Loading face engine…", mr: "फेस इंजिन लोड होत आहे…" },
  cameraError: { en: "Camera not available. Allow camera permission.", mr: "कॅमेरा उपलब्ध नाही. कॅमेरा परवानगी द्या." },
  lookAtCamera: { en: "Look at the camera", mr: "कॅमेऱ्याकडे पहा" },
  scanning: { en: "Scanning…", mr: "स्कॅन होत आहे…" },
  unknownFace: { en: "Not registered", mr: "नोंदणी नाही" },
  unknownHint: { en: "This face is not in the system", mr: "हा चेहरा सिस्टीममध्ये नाही" },
  markedIn: { en: "IN", mr: "आत" },
  markedOut: { en: "OUT", mr: "बाहेर" },
  welcome: { en: "Welcome", mr: "स्वागत" },
  goodbye: { en: "Goodbye", mr: "पुन्हा भेटू" },
  tooSoon: { en: "Already scanned just now", mr: "आत्ताच स्कॅन झाले आहे" },
  exitScan: { en: "Exit", mr: "बाहेर पडा" },
  search: { en: "Search by name…", mr: "नावाने शोधा…" },
  noStudents: { en: "No students yet. Add the first one.", mr: "अजून विद्यार्थी नाहीत. पहिला जोडा." },
  noLogs: { en: "No records", mr: "नोंदी नाहीत" },
  all: { en: "All", mr: "सर्व" },
  date: { en: "Date", mr: "तारीख" },
  student: { en: "Student", mr: "विद्यार्थी" },
  time: { en: "Time", mr: "वेळ" },
  type: { en: "Type", mr: "प्रकार" },
  lastSeen: { en: "Last", mr: "शेवटचे" },
  delete: { en: "Delete", mr: "हटवा" },
  confirmDelete: { en: "Delete this student and all records?", mr: "हा विद्यार्थी व सर्व नोंदी हटवायच्या?" },
  faces: { en: "face samples", mr: "चेहरा नमुने" },
  photos: { en: "photos", mr: "फोटो" },
  notScanned: { en: "Not scanned today", mr: "आज स्कॅन नाही" },
  ready: { en: "Ready", mr: "तयार" },
  error: { en: "Something went wrong", mr: "काहीतरी चूक झाली" },
} as const;

export type TKey = keyof typeof dict;

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: TKey) => string };
const I18nContext = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (k) => dict[k].en });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const stored = window.localStorage.getItem("lang");
    if (stored === "mr" || stored === "en") setLangState(stored);
  }, []);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem("lang", l);
  }, []);
  const t = useCallback((k: TKey) => dict[k][lang], [lang]);
  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export const useT = () => useContext(I18nContext);
