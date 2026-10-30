import { useEffect, useState } from "react";

// Returns `value` only after it stopped changing for `delay` ms.
// Used so we don't call the server on every single keystroke. Generic: works for any type.
export function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
