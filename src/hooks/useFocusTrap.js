import { useEffect } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
// Keeps Tab inside a dialog, focuses the first field when it opens, and gives focus
// back to whatever opened it when it closes. Required for accessible modals.
export function useFocusTrap(ref, active) {
  useEffect(() => {
    if (!active || !ref.current) return undefined;
    const node = ref.current;
    const opener = document.activeElement;
    const items = () => [...node.querySelectorAll(FOCUSABLE)].filter((el) => !el.hasAttribute("hidden"));
    const first = node.querySelector("[data-autofocus]") || items()[0] || node;
    first.focus?.();
    const onKey = (e) => {
      if (e.key !== "Tab") return;
      const list = items();
      if (!list.length) {
        e.preventDefault();
        return;
      }
      const a = list[0];
      const z = list[list.length - 1];
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault();
        a.focus();
      }
    };
    node.addEventListener("keydown", onKey);
    return () => {
      node.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [ref, active]);
}
