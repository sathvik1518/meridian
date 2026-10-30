import { useState } from "react";
import { cn } from "../../lib/cn";
import { initials } from "../../lib/format";

const HUES = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)", "var(--c6)"];

const hueFor = (name = "") => HUES[[...name].reduce((n, ch) => n + ch.charCodeAt(0), 0) % HUES.length];

const SIZES = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-lg" };

export default function Avatar({ name, src, size = "md", className }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn("shrink-0 rounded-full bg-surface-2 object-cover", SIZES[size], className)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{ background: hueFor(name) }}
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-semibold text-white dark:text-[#0c1310]",
        SIZES[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
