import { ClipboardCheck, ClipboardPlus } from "lucide-react";
import { useInQueue, useRestock } from "../../store/restockStore";
import { toast } from "../../store/toastStore";
import { cn } from "../../lib/cn";
import Button from "../ui/Button";

// Adds / removes a product from the shared restock queue (Zustand store).
export default function QueueButton({ product, variant = "icon", className }) {
  const inQueue = useInQueue(product.id);
  const add = useRestock((s) => s.add);
  const remove = useRestock((s) => s.remove);
  const toggle = (e) => {
    e.stopPropagation();
    if (inQueue) {
      remove(product.id);
      toast.info("Removed from restock queue", product.title);
    } else {
      add(product);
      toast.success("Added to restock queue", product.title);
    }
  };
  if (variant === "full") {
    return (
      <Button variant={inQueue ? "soft" : "secondary"} onClick={toggle} className={className} aria-pressed={inQueue}>
        {inQueue ? <ClipboardCheck className="size-4" /> : <ClipboardPlus className="size-4" />}
        {inQueue ? "In restock queue" : "Add to restock queue"}
      </Button>
    );
  }
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      aria-pressed={inQueue}
      aria-label={inQueue ? `Remove ${product.title} from restock queue` : `Add ${product.title} to restock queue`}
      title={inQueue ? "In restock queue" : "Add to restock queue"}
      className={cn(inQueue && "bg-accent-soft text-accent-ink hover:bg-accent-soft", className)}
    >
      {inQueue ? <ClipboardCheck className="size-4" /> : <ClipboardPlus className="size-4" />}
    </Button>
  );
}
