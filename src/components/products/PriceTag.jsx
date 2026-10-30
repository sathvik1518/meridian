import { discounted, money } from "../../lib/format";
import { cn } from "../../lib/cn";

export default function PriceTag({ price, discount = 0, size = "md", className }) {
  const has = Number(discount) > 0.5;
  return (
    <span className={cn("num inline-flex items-baseline gap-2", className)}>
      <span className={cn("font-semibold", size === "lg" ? "font-display text-3xl tracking-tight" : "text-sm")}>
        {money(has ? discounted(price, discount) : price)}
      </span>
      {has && <span className={cn("text-ink-3 line-through", size === "lg" ? "text-base" : "text-xs")}>{money(price)}</span>}
    </span>
  );
}
