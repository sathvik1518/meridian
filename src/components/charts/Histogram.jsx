import { useState } from "react";
import { cn } from "../../lib/cn";

// Vertical bars built with plain HTML so they stay readable on small screens.
export default function Histogram({ bins, label, unit = "products" }) {
  const [active, setActive] = useState(null);
  const max = Math.max(1, ...bins.map((b) => b.count));
  return (
    <div role="img" aria-label={`${label}: ${bins.map((b) => `${b.label} ${b.count}`).join(", ")}`}>
      <div className="relative">
        {[0.25, 0.5, 0.75, 1].map((p) => (
          <div
            key={p}
            className="absolute inset-x-0 border-t border-dashed border-line"
            style={{ bottom: `${p * 100}%` }}
            aria-hidden="true"
          />
        ))}
        <div className="relative flex h-48 items-end gap-1.5 sm:gap-2.5">
          {bins.map((b, i) => (
            <div
              key={b.label}
              className="group relative flex h-full flex-1 items-end"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              <div
                className={cn(
                  "origin-bottom-grow w-full rounded-t-md transition-[filter,opacity]",
                  active !== null && active !== i && "opacity-40",
                )}
                style={{ height: `${(b.count / max) * 100}%`, background: "var(--c1)", animationDelay: `${i * 50}ms` }}
              />
              {active === i && (
                <div className="num pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-bg shadow-lg">
                  {b.count} {unit} · {b.label}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2.5">
        {bins.map((b) => (
          <span key={b.label} className="num flex-1 text-center text-[11px] leading-tight text-ink-3">
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
