import { cn } from "../../lib/cn";

export default function Skeleton({ className, ...props }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" {...props} />;
}
