import { cn } from "../../lib/cn";

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      {Icon && (
        <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-surface-2 text-ink-3">
          <Icon className="size-6" aria-hidden="true" />
        </span>
      )}
      <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-2">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
