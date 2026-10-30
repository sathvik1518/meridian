import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

const KEY = "meridian:theme";

export function ThemeProvider({ children }) {
  // index.html already put the right class on <html> before React loaded.
  const [theme, setThemeState] = useState(() => (document.documentElement.classList.contains("dark") ? "dark" : "light"));
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);
  const toggle = useCallback(() => setThemeState((t) => (t === "dark" ? "light" : "dark")), []);
  const value = useMemo(() => ({ theme, isDark: theme === "dark", toggle, setTheme: setThemeState }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
