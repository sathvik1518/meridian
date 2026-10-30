import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { cn } from "../../lib/cn";

// The base for every popup: dialog, side drawer and the command palette.
// It handles Escape, clicking outside, scroll locking and keyboard focus for us.
const WRAP = {
  center: "items-center justify-center p-4",
  right: "justify-end",
  left: "justify-start",
  top: "items-start justify-center p-4 pt-[10vh]",
};

const PANEL = {
  center: "w-full max-w-md rounded-2xl animate-pop-in",
  right: "h-full w-full max-w-[34rem] border-l animate-slide-in-right",
  left: "h-full border-r animate-slide-in-left",
  top: "w-full max-w-xl rounded-2xl animate-pop-in",
};

export default function Overlay({ open, onClose, label, placement = "center", className, children }) {
  const panelRef = useRef(null);
  useFocusTrap(panelRef, open);
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className={cn("fixed inset-0 z-50 flex", WRAP[placement])}>
      <div className="animate-fade-in absolute inset-0 bg-ink/45 backdrop-blur-[3px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cn("relative border-line bg-surface shadow-[var(--shadow-pop)] outline-none", "border", PANEL[placement], className)}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
