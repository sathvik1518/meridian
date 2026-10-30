import { cn } from "../../lib/cn";

export function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-9", className)} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="var(--side-active)" />
      <path d="M14 46V18l18 20 18-20v28" fill="none" stroke="#ff7a3d" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ collapsed = false, className }) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <LogoMark />
      {!collapsed && <span className="font-display text-xl font-semibold tracking-tight">Meridian</span>}
    </span>
  );
}
