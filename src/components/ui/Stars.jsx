import { Star } from "lucide-react";
import { cn } from "../../lib/cn";

// Shows a rating out of 5. The gold layer is clipped to the exact percentage.
export default function Stars({ value = 0, className, showNumber = true }) {
  const pct = Math.max(0, Math.min(100, (Number(value) / 5) * 100));
  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      role="img"
      aria-label={`Rated ${Number(value).toFixed(1)} out of 5`}
    >
      <span className="relative inline-flex">
        <span className="inline-flex text-line-strong">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="size-3.5 fill-current" />
          ))}
        </span>
        <span className="absolute inset-0 inline-flex overflow-hidden text-warn" style={{ width: `${pct}%` }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="size-3.5 shrink-0 fill-current" />
          ))}
        </span>
      </span>
      {showNumber && <span className="num text-xs font-medium text-ink-2">{Number(value) ? Number(value).toFixed(1) : "New"}</span>}
    </span>
  );
}
