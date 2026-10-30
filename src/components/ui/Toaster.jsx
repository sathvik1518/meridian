import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { useToastStore } from "../../store/toastStore";
import { cn } from "../../lib/cn";

const TONES = {
  ok: { icon: CheckCircle2, color: "text-ok", bar: "bg-ok" },
  bad: { icon: AlertCircle, color: "text-bad", bar: "bg-bad" },
  warn: { icon: TriangleAlert, color: "text-warn", bar: "bg-warn" },
  info: { icon: Info, color: "text-info", bar: "bg-info" },
};

function Toast({ toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const tone = TONES[toast.tone] || TONES.info;
  const Icon = tone.icon;
  useEffect(() => {
    const id = setTimeout(() => dismiss(toast.id), toast.duration);
    return () => clearTimeout(id);
  }, [toast.id, toast.duration, dismiss]);
  return (
    <div className="animate-pop-in relative flex w-[22rem] max-w-[calc(100vw-2rem)] items-start gap-3 overflow-hidden rounded-xl border border-line bg-surface p-4 shadow-[var(--shadow-pop)]">
      <span className={cn("absolute inset-y-0 left-0 w-1", tone.bar)} aria-hidden="true" />
      <Icon className={cn("mt-0.5 size-5 shrink-0", tone.color)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-sm text-ink-2">{toast.description}</p>}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss notification"
        className="-m-1 cursor-pointer rounded-md p-1 text-ink-3 hover:bg-surface-2 hover:text-ink"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-[60] flex flex-col items-end gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast toast={t} />
        </div>
      ))}
    </div>
  );
}
