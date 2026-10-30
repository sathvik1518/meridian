import { X } from "lucide-react";
import Overlay from "./Overlay";
import Button from "./Button";

export default function Drawer({ open, onClose, title, description, children }) {
  return (
    <Overlay open={open} onClose={onClose} label={title} placement="right" className="flex flex-col">
      <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-ink-2">{description}</p>}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
          <X className="size-4" />
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">{children}</div>
    </Overlay>
  );
}
