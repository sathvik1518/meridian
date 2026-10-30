import { stockStatus } from "../../lib/format";
import { cn } from "../../lib/cn";

const BAR = { ok: "bg-ok", warn: "bg-warn", bad: "bg-bad" };

// A number plus a thin bar, colored by status, so low stock stands out at a glance.
export default function StockMeter({ stock, className }) {
  const s = stockStatus(stock);
  const pct = Math.min(100, ((Number(stock) || 0) / 100) * 100);
  return (
    <div className={cn("w-28", className)}>
      <div className="flex items-baseline justify-between text-sm">
        <span className="num font-medium">{Number(stock) || 0}</span>
        <span className="text-xs text-ink-3">{s.key === "ok" ? "units" : s.label}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
        <div className={cn("h-full rounded-full", BAR[s.tone])} style={{ width: `${Math.max(s.key === "out" ? 0 : 6, pct)}%` }} />
      </div>
    </div>
  );
}
