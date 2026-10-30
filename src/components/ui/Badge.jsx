import { cn } from "../../lib/cn";

const TONES = {
  neutral: "bg-surface-2 text-ink-2 border-line",
  accent: "bg-accent-soft text-accent-ink border-transparent",
  ok: "bg-ok-soft text-ok-ink border-transparent",
  warn: "bg-warn-soft text-warn-ink border-transparent",
  bad: "bg-bad-soft text-bad-ink border-transparent",
  info: "bg-info-soft text-info-ink border-transparent",
};

const DOTS = { neutral: "bg-ink-3", accent: "bg-accent", ok: "bg-ok", warn: "bg-warn", bad: "bg-bad", info: "bg-info" };

export default function Badge({ tone = "neutral", dot = false, className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", DOTS[tone])} aria-hidden="true" />}
      {children}
    </span>
  );
}
