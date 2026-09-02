import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useT();
  return (
    <div className={cn("inline-flex rounded-full border bg-card p-0.5 text-xs font-semibold", className)}>
      {(["mr", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={cn(
            "rounded-full px-3 py-1.5 transition-colors",
            lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
          aria-pressed={lang === l}
        >
          {l === "mr" ? "मराठी" : "EN"}
        </button>
      ))}
    </div>
  );
}
