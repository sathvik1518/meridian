import { useEffect, useRef, useState } from "react";

// Animates a number from its previous value to `target` (skipped for reduced motion).
export function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const goal = Number(target) || 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = goal;
      const id = requestAnimationFrame(() => setValue(goal));
      return () => cancelAnimationFrame(id);
    }
    const start = performance.now();
    const origin = from.current;
    let raf = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(origin + (goal - origin) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = goal;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}
