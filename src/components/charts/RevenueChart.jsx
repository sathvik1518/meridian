import { memo, useId, useState } from "react";
import { compactMoney, formatShortDate, money } from "../../lib/format";

// An area chart drawn with one SVG path. The shapes scale with the card; labels and the tooltip are
// plain HTML so text never gets squashed. React.memo: it only redraws when `data` really changes.
function RevenueChart({ data }) {
  const gradient = useId();
  const [active, setActive] = useState(null);
  const W = 600;
  const H = 200;
  const max = Math.max(1, ...data.map((d) => d.revenue)) * 1.1;
  const x = (i) => (data.length > 1 ? (i / (data.length - 1)) * W : W / 2);
  const y = (v) => H - (v / max) * H;
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.revenue).toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const ticks = [0, 0.5, 1].map((p) => max * p);
  const total = data.reduce((n, d) => n + d.revenue, 0);
  const onMove = (e) => {
    const box = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    setActive(Math.round(ratio * (data.length - 1)));
  };
  const point = active === null ? null : data[active];
  return (
    <figure>
      <div className="flex gap-3">
        <div className="relative hidden h-52 w-10 shrink-0 sm:block" aria-hidden="true">
          {ticks.map((t) => (
            <span
              key={t}
              className="num absolute right-0 -translate-y-1/2 text-[11px] text-ink-3"
              style={{ top: `${100 - (t / max) * 100}%` }}
            >
              {compactMoney(t)}
            </span>
          ))}
        </div>
        <div className="relative h-52 min-w-0 flex-1" onMouseMove={onMove} onMouseLeave={() => setActive(null)}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="size-full overflow-visible"
            role="img"
            aria-label={`Revenue over the last ${data.length} days, ${money(total)} in total`}
          >
            <defs>
              <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--c1)" stopOpacity="0.35" />
                <stop offset="1" stopColor="var(--c1)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {ticks.map((t) => (
              <line
                key={t}
                x1="0"
                x2={W}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--line)"
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <path d={area} fill={`url(#${gradient})`} />
            <path
              d={line}
              fill="none"
              stroke="var(--c1)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {point && active !== null && (
            <>
              <div
                className="pointer-events-none absolute inset-y-0 w-px bg-line-strong"
                style={{ left: `${(x(active) / W) * 100}%` }}
                aria-hidden="true"
              />
              <span
                className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-[var(--c1)]"
                style={{ left: `${(x(active) / W) * 100}%`, top: `${(y(point.revenue) / H) * 100}%` }}
                aria-hidden="true"
              />
              <div
                className="num pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-xs whitespace-nowrap text-bg shadow-lg"
                style={{ left: `clamp(60px, ${(x(active) / W) * 100}%, calc(100% - 60px))`, bottom: "calc(100% + 6px)" }}
              >
                <span className="block font-semibold">{money(point.revenue)}</span>
                <span className="opacity-70">
                  {formatShortDate(point.date + "T12:00:00")} · {point.orders} orders
                </span>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="mt-2 flex justify-between pl-0 text-[11px] text-ink-3 sm:pl-[52px]" aria-hidden="true">
        <span>{data[0] && formatShortDate(data[0].date + "T12:00:00")}</span>
        <span>{data[Math.floor(data.length / 2)] && formatShortDate(data[Math.floor(data.length / 2)].date + "T12:00:00")}</span>
        <span>{data.at(-1) && formatShortDate(data.at(-1).date + "T12:00:00")}</span>
      </div>
      {/* The same numbers as a table, for screen readers (the picture above is hidden detail to them). */}
      <table className="sr-only">
        <caption>Daily revenue</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Revenue</th>
            <th>Orders</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <td>{d.date}</td>
              <td>{money(d.revenue)}</td>
              <td>{d.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export default memo(RevenueChart);
