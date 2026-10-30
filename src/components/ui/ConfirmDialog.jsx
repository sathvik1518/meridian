import { AlertTriangle } from "lucide-react";
import Overlay from "./Overlay";
import Button from "./Button";

export default function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Confirm", loading = false }) {
  return (
    <Overlay open={open} onClose={onClose} label={title}>
      <div className="p-6">
        <span className="mb-4 grid size-11 place-items-center rounded-xl bg-bad-soft text-bad-ink">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </span>
        <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1.5 text-sm text-ink-2">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} data-autofocus>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Overlay>
  );
}
