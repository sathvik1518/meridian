import { useEffect, useRef, useState } from "react";
import { LogOut, Moon, ShieldAlert, Sun } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useUiStore } from "../../store/uiStore";
import { cn } from "../../lib/cn";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const simulate = useUiStore((s) => s.simulateFailures);
  const setSimulate = useUiStore((s) => s.setSimulateFailures);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const item = "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-surface-2";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex cursor-pointer items-center gap-2 rounded-full p-0.5 pr-2 ring-1 ring-line transition hover:ring-line-strong"
      >
        <Avatar name={user?.name ?? ""} size="sm" />
        <span className="hidden text-sm font-medium sm:block">{user?.name?.split(" ")[0]}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="animate-pop-in absolute right-0 z-40 mt-2 w-72 origin-top-right rounded-2xl border border-line bg-surface p-2 shadow-[var(--shadow-pop)]"
        >
          <div className="px-3 pt-2 pb-3">
            <p className="font-medium">{user?.name}</p>
            <p className="text-sm text-ink-2">{user?.email}</p>
            <Badge tone={user?.role === "admin" ? "accent" : "info"} className="mt-2" dot>
              {user?.role === "admin" ? "Admin · can edit" : "Viewer · read only"}
            </Badge>
          </div>
          <div className="border-t border-line pt-2">
            <button role="menuitem" type="button" className={item} onClick={toggle}>
              {isDark ? <Sun className="size-4 text-ink-2" /> : <Moon className="size-4 text-ink-2" />}
              {isDark ? "Switch to light mode" : "Switch to dark mode"}
            </button>
            <button role="menuitemcheckbox" aria-checked={simulate} type="button" className={item} onClick={() => setSimulate(!simulate)}>
              <ShieldAlert className="size-4 text-ink-2" />
              <span className="flex-1">
                Simulate failed saves
                <span className="block text-xs text-ink-3">Shows how rollbacks work</span>
              </span>
              <span
                className={cn("relative h-5 w-9 rounded-full transition", simulate ? "bg-accent" : "bg-line-strong")}
                aria-hidden="true"
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-4 rounded-full bg-white shadow transition-all",
                    simulate ? "left-[18px]" : "left-0.5",
                  )}
                />
              </span>
            </button>
            <button role="menuitem" type="button" className={cn(item, "text-bad-ink dark:text-bad")} onClick={() => void logout()}>
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
