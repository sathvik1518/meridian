import { useState } from "react";
import { cn } from "../../lib/cn";

const SIZES = { sm: "size-10 rounded-lg", md: "size-14 rounded-xl", lg: "size-full rounded-2xl" };

export default function ProductThumb({ src, alt = "", title = "", size = "sm", className, eager = false }) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;
  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden border border-line bg-surface-2",
        SIZES[size],
        className,
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          width={240}
          height={240}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden="true" className="font-display text-lg font-semibold text-ink-3">
          {(title || "?").trim().charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}
