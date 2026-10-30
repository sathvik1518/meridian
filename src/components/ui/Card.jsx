import { cn } from "../../lib/cn";

export default function Card({ as: Tag = "section", className, children, ...props }) {
  return (
    <Tag className={cn("rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]", className)} {...props}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, description, action, className }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-5 sm:px-6", className)}>
      <div className="min-w-0">
        <h2 className="font-display text-lg leading-tight font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-ink-2">{description}</p>}
      </div>
      {action}
    </div>
  );
}
