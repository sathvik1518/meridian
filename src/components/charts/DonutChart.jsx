import { useState } from "react";
import { cn } from "../../lib/cn";

// A donut drawn with SVG circles. Each segment is a dashed stroke around the ring.
export default function DonutChart({ segments, centerValue, centerLabel, size = 184, thickness = 22, label, stacked = false }) {
  const [active, setActive] = useState(null);
  const total = segments.reduce((n, s) => n + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  const gap = segments.filter((s) => s.value > 0).length > 1 ? 3 : 0;
  let offset = 0;
  const arcs = segments.map((s, i) => {
    const len = Math.max(0, (s.value / total) * C - gap);
    const arc = { ...s, i, len, offset };
    offset += (s.value / total) * C;
    return arc;
  });
  const hovered = active === null ? null : arcs[active];
  return (
    <div className={cn("flex flex-col items-center gap-6", !stacked && "sm:flex-row sm:items-center")}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={thickness} />
          {arcs.map((a) => (
            <circle
              key={a.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={active === a.i ? thickness + 4 : thickness}
              strokeDasharray={`${a.len} ${C - a.len}`}
              strokeDashoffset={-a.offset}
              strokeLinecap="butt"
              opacity={active === null || active === a.i ? 1 : 0.35}
              style={{ transition: "stroke-width .15s, opacity .15s" }}
              onMouseEnter={() => setActive(a.i)}
              onMouseLeave={() => setActive(null)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="num font-display text-3xl leading-none font-semibold tracking-tight">{hovered ? hovered.value : centerValue}</p>
            <p className="mt-1 text-xs text-ink-2">{hovered ? hovered.label : centerLabel}</p>
          </div>
        </div>
      </div>

      <ul className={cn("w-full min-w-0 space-y-1.5", !stacked && "sm:flex-1")}>
        {arcs.map((a) => (
          <li key={a.label}>
            <button
              type="button"
              onMouseEnter={() => setActive(a.i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(a.i)}
              onBlur={() => setActive(null)}
              className={cn(
                "flex w-full cursor-default items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition",
                active === a.i && "bg-surface-2",
              )}
            >
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: a.color }} aria-hidden="true" />
              <span className="flex-1 truncate text-ink-2">{a.label}</span>
              <span className="num font-medium">{a.value}</span>
              <span className="num w-10 text-right text-xs text-ink-3">{Math.round((a.value / total) * 100)}%</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
