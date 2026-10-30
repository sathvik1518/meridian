import { cn } from "../../lib/cn";

// A generic component: <SegmentedControl<"table" | "grid"> ... /> only accepts those exact values.
export default function SegmentedControl({ label, options, value, onChange, className }) {
  return (
    <div role="group" aria-label={label} className={cn("inline-flex rounded-xl border border-line bg-surface-2 p-0.5", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            aria-label={o.ariaLabel}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[10px] px-3 text-[13px] font-medium transition",
              active ? "bg-surface text-ink shadow-[var(--shadow-card)]" : "text-ink-2 hover:text-ink",
            )}
          >
            {o.icon && <o.icon className="size-3.5" aria-hidden="true" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
