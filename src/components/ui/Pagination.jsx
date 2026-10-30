import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "./Button";
import { cn } from "../../lib/cn";

function pagesToShow(page, last) {
  const set = new Set([1, last, page, page - 1, page + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= last).sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

export default function Pagination({ page, total, pageSize, onChange, className }) {
  const last = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav aria-label="Pagination" className={cn("flex flex-col items-center justify-between gap-3 sm:flex-row", className)}>
      <p className="num text-sm text-ink-2">
        Showing{" "}
        <span className="font-medium text-ink">
          {from}–{to}
        </span>{" "}
        of <span className="font-medium text-ink">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </Button>
        {pagesToShow(page, last).map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-1 text-ink-3" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
              aria-label={`Page ${p}`}
              className={cn(
                "num h-9 min-w-9 cursor-pointer rounded-lg px-2 text-sm font-medium transition",
                p === page ? "bg-ink text-bg" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
              )}
            >
              {p}
            </button>
          ),
        )}
        <Button variant="ghost" size="icon" onClick={() => onChange(page + 1)} disabled={page >= last} aria-label="Next page">
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </nav>
  );
}
