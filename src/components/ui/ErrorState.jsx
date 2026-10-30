import { CloudOff, RotateCw } from "lucide-react";
import Button from "./Button";
import { cn } from "../../lib/cn";

export default function ErrorState({ error, onRetry, className, title = "We couldn't load this" }) {
  return (
    <div role="alert" className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-bad-soft text-bad-ink">
        <CloudOff className="size-6" aria-hidden="true" />
      </span>
      <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-2">{error?.message || "Something went wrong. Please try again."}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          <RotateCw className="size-3.5" aria-hidden="true" /> Try again
        </Button>
      )}
    </div>
  );
}
