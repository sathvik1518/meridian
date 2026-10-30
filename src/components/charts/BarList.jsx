import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";

// Horizontal bars: the clearest way to compare named categories.
export default function BarList({ items, format = (v) => String(v), label }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3" aria-label={label}>
      {items.map((item, idx) => {
        const row = (
          <>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium">{item.label}</span>
              <span className="num shrink-0 text-ink-2">{format(item.value)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="origin-left-grow h-full rounded-full"
                style={{ width: `${(item.value / max) * 100}%`, background: item.color || "var(--c1)", animationDelay: `${idx * 60}ms` }}
              />
            </div>
          </>
        );
        return (
          <li key={item.label}>
            {item.href ? (
              <Link
                to={item.href}
                className={cn("-mx-2 block rounded-lg px-2 py-1 transition hover:bg-surface-2")}
                aria-label={`${item.label}: ${format(item.value)}. View products`}
              >
                {row}
              </Link>
            ) : (
              row
            )}
          </li>
        );
      })}
    </ul>
  );
}
