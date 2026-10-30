import { memo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { usePrefetchProduct } from "../../hooks/queries";
import { titleCase } from "../../lib/format";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import ProductThumb from "../ui/ProductThumb";
import Stars from "../ui/Stars";
import PriceTag from "./PriceTag";
import QueueButton from "./QueueButton";
import StockMeter from "./StockMeter";

function ProductTable({ products, canEdit, onEdit, onDelete }) {
  const navigate = useNavigate();
  const location = useLocation();
  const prefetch = usePrefetchProduct();
  const from = location.pathname + location.search;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[56rem] text-left text-sm">
        <caption className="sr-only">Products. Select a row to open its details.</caption>
        <thead>
          <tr className="border-b border-line text-xs tracking-wide text-ink-3 uppercase">
            <th scope="col" className="px-6 py-3 font-semibold">
              Product
            </th>
            <th scope="col" className="px-3 py-3 font-semibold">
              Category
            </th>
            <th scope="col" className="px-3 py-3 font-semibold">
              Price
            </th>
            <th scope="col" className="px-3 py-3 font-semibold">
              Stock
            </th>
            <th scope="col" className="px-3 py-3 font-semibold">
              Rating
            </th>
            <th scope="col" className="px-6 py-3 text-right font-semibold">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {products.map((p, index) => (
            <tr
              key={p.id}
              onClick={() => navigate(`/products/${p.id}`, { state: { from } })}
              onMouseEnter={() => prefetch(p.id)}
              onFocus={() => prefetch(p.id)}
              className="group cursor-pointer transition-colors hover:bg-surface-2/70"
            >
              <td className="px-6 py-3">
                <div className="flex items-center gap-3.5">
                  <ProductThumb src={p.thumbnail} alt="" title={p.title} eager={index < 6} />
                  <div className="min-w-0">
                    <Link
                      to={`/products/${p.id}`}
                      state={{ from }}
                      onClick={(e) => e.stopPropagation()}
                      className="block max-w-[18rem] truncate font-medium hover:text-accent"
                    >
                      {p.title}
                    </Link>
                    <p className="truncate text-xs text-ink-3">{[p.brand, p.sku].filter(Boolean).join(" · ") || `ID ${p.id}`}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-3">
                <Badge>{titleCase(p.category)}</Badge>
              </td>
              <td className="px-3 py-3">
                <PriceTag price={p.price} discount={p.discountPercentage} />
              </td>
              <td className="px-3 py-3">
                <StockMeter stock={p.stock} />
              </td>
              <td className="px-3 py-3">
                <Stars value={p.rating} />
              </td>
              <td className="px-6 py-3">
                <div className="flex items-center justify-end gap-0.5">
                  <QueueButton product={p} />
                  {canEdit && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${p.title}`}
                        title="Edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(p);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${p.title}`}
                        title="Delete"
                        className="hover:bg-bad-soft hover:text-bad-ink"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(p);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default memo(ProductTable);
