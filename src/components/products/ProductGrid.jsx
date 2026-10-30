import { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { usePrefetchProduct } from "../../hooks/queries";
import { stockStatus, titleCase } from "../../lib/format";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import ProductThumb from "../ui/ProductThumb";
import Stars from "../ui/Stars";
import PriceTag from "./PriceTag";
import QueueButton from "./QueueButton";

function ProductGrid({ products, canEdit, onEdit, onDelete }) {
  const location = useLocation();
  const prefetch = usePrefetchProduct();
  const from = location.pathname + location.search;
  return (
    <ul className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 2xl:grid-cols-4">
      {products.map((p, index) => {
        const s = stockStatus(p.stock);
        return (
          <li
            key={p.id}
            onMouseEnter={() => prefetch(p.id)}
            className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-pop)]"
          >
            <Link
              to={`/products/${p.id}`}
              state={{ from }}
              className="relative block aspect-[4/3] bg-surface-2"
              aria-label={`Open ${p.title}`}
            >
              <ProductThumb
                src={p.thumbnail}
                title={p.title}
                size="lg"
                eager={index < 4}
                className="rounded-none border-0 bg-transparent"
              />
              <span className="absolute top-3 left-3">
                <Badge tone={s.tone} dot>
                  {s.label}
                </Badge>
              </span>
            </Link>
            <div className="flex flex-1 flex-col p-4">
              <Badge className="self-start">{titleCase(p.category)}</Badge>
              <Link
                to={`/products/${p.id}`}
                state={{ from }}
                className="mt-2.5 line-clamp-2 min-h-[2.75rem] leading-snug font-medium hover:text-accent"
              >
                {p.title}
              </Link>
              <div className="mt-2">
                <Stars value={p.rating} />
              </div>
              <div className="mt-4 flex items-end justify-between gap-2">
                <PriceTag price={p.price} discount={p.discountPercentage} />
                <div className="flex gap-0.5">
                  <QueueButton product={p} />
                  {canEdit && (
                    <>
                      <Button variant="ghost" size="icon-sm" aria-label={`Edit ${p.title}`} onClick={() => onEdit(p)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${p.title}`}
                        className="hover:bg-bad-soft hover:text-bad-ink"
                        onClick={() => onDelete(p)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <p className="num mt-1 text-xs text-ink-3">{p.stock} in stock</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// memo: skip re-rendering the whole grid when the parent re-renders for unrelated reasons
// (typing in the search box, opening a drawer). Only a change in `products`/handlers redraws it.
export default memo(ProductGrid);
