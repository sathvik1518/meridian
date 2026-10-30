import { Loader2 } from "lucide-react";
import { cn } from "../../lib/cn";

export default function Spinner({ className, label = "Loading" }) {
  return <Loader2 className={cn("animate-spin-slow size-5 text-ink-3", className)} role="status" aria-label={label} />;
}
