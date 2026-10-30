import { useEffect, useRef } from "react";

// useHotkey("mod+k", handler): "mod" means Ctrl on Windows/Linux and Cmd on Mac.
// Plain keys like "/" are ignored while you are typing in a field.
export function useHotkey(combo, handler, { enabled = true } = {}) {
  const saved = useRef(handler);
  useEffect(() => {
    saved.current = handler;
  });
  useEffect(() => {
    if (!enabled) return undefined;
    const wantsMod = combo.startsWith("mod+");
    const key = combo.replace("mod+", "").toLowerCase();
    const onKey = (e) => {
      if (e.key.toLowerCase() !== key) return;
      if (wantsMod) {
        if (!(e.metaKey || e.ctrlKey)) return;
      } else {
        const t = e.target;
        const typing = t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));
        if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      }
      e.preventDefault();
      saved.current(e);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [combo, enabled]);
}
