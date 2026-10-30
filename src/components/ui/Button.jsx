import { Loader2 } from "lucide-react";
import { cn } from "../../lib/cn";

const VARIANTS = {
  primary:
    "bg-accent text-on-accent hover:bg-accent-hover shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_rgb(20_34_29/0.25)] active:translate-y-px",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-surface-2 active:translate-y-px",
  soft: "bg-accent-soft text-accent-ink hover:brightness-95",
  ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
  danger: "bg-bad text-on-bad hover:brightness-110 active:translate-y-px",
};

const SIZES = {
  sm: "h-8 gap-1.5 px-3 text-[13px]",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-12 gap-2 px-6 text-[15px]",
  icon: "h-9 w-9",
  "icon-sm": "h-8 w-8",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl font-medium whitespace-nowrap transition duration-150 select-none",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="animate-spin-slow size-4" aria-hidden="true" />}
      {children}
    </button>
  );
}
