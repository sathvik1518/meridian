import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Download, Minus, PackagePlus, Plus, Send, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useProductList } from "../hooks/queries";
import { useRestockMutation } from "../hooks/mutations";
import { useRestock } from "../store/restockStore";
import { toast } from "../store/toastStore";
import { LOW_STOCK, money, toCsv } from "../lib/format";
import Button from "../components/ui/Button";
import Card, { CardHeader } from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import ProductThumb from "../components/ui/ProductThumb";

function download(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// "Anything with 15 units or fewer", lowest first. The server does the filtering.
const ATTENTION = { q: "", category: "", stock: "attention", sort: "stock-asc", page: 1, pageSize: 50 };

export default function Restock() {
  const { user } = useAuth();
  const canOrder = user?.role === "admin";
  const itemsMap = useRestock((s) => s.items);
  const { setQty, remove, clear, add } = useRestock.getState();
  const items = useMemo(() => Object.values(itemsMap), [itemsMap]);
  const lowStock = useProductList(ATTENTION);
  const place = useRestockMutation();
  const [confirmClear, setConfirmClear] = useState(false);
  const totals = useMemo(
    () => ({ lines: items.length, units: items.reduce((n, i) => n + i.qty, 0), cost: items.reduce((n, i) => n + i.qty * i.price, 0) }),
    [items],
  );
  const suggestions = useMemo(() => (lowStock.data?.items ?? []).filter((p) => !itemsMap[p.id]), [lowStock.data, itemsMap]);
  function exportCsv() {
    download(
      "restock-queue.csv",
      toCsv(
        items.map((i) => ({
          id: i.id,
          product: i.title,
          current_stock: i.stock,
          order_qty: i.qty,
          unit_price: i.price.toFixed(2),
          line_total: (i.qty * i.price).toFixed(2),
        })),
      ),
    );
    toast.success("CSV downloaded", `${items.length} lines exported`);
  }
  // A real request now: the server adds the stock to each product in ONE database transaction.
  function placeOrder() {
    place.mutate(
      items.map((i) => ({ productId: i.id, qty: i.qty })),
      {
        onSuccess: (result) => {
          clear();
          toast.success("Restock order placed", `${result.units} units added across ${result.lines} products`);
        },
        onError: (error) => toast.error("Couldn't place the order", error.message),
      },
    );
  }
  const addAll = () => {
    suggestions.forEach(add);
    toast.success("Added to queue", `${suggestions.length} low-stock products`);
  };
  return (
    <>
      <PageHeader
        title="Restock queue"
        description="Products you've flagged to reorder. Adjust quantities, then export or place the order."
        actions={
          items.length > 0 && (
            <Button variant="ghost" onClick={() => setConfirmClear(true)}>
              <Trash2 className="size-4" /> Clear queue
            </Button>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:gap-8">
        <div className="space-y-6">
          <Card>
            {items.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Your queue is empty"
                description="Flag products from the dashboard or product list with the clipboard button, or add everything that's running low."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Link to="/products?stock=low">
                      <Button variant="secondary">View low stock</Button>
                    </Link>
                    {suggestions.length > 0 && (
                      <Button onClick={addAll}>
                        <PackagePlus className="size-4" /> Add all {suggestions.length} low-stock
                      </Button>
                    )}
                  </div>
                }
              />
            ) : (
              <ul className="divide-y divide-line">
                {items.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 sm:px-6">
                    <ProductThumb src={i.thumbnail} title={i.title} />
                    <div className="min-w-0 flex-1 basis-48">
                      <Link to={`/products/${i.id}`} className="block truncate font-medium hover:text-accent">
                        {i.title}
                      </Link>
                      <p className="num text-xs text-ink-3">
                        {i.stock} in stock · {money(i.price)} each
                      </p>
                    </div>
                    <div
                      className="flex items-center gap-1 rounded-xl border border-line-strong p-0.5"
                      role="group"
                      aria-label={`Quantity for ${i.title}`}
                    >
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Decrease quantity"
                        onClick={() => setQty(i.id, i.qty - 5)}
                        disabled={i.qty <= 1}
                      >
                        <Minus className="size-3.5" />
                      </Button>
                      <input
                        type="number"
                        min="1"
                        max="9999"
                        value={i.qty}
                        onChange={(e) => setQty(i.id, Number(e.target.value))}
                        aria-label="Order quantity"
                        className="num h-8 w-14 bg-transparent text-center text-sm font-medium outline-none"
                      />
                      <Button variant="ghost" size="icon-sm" aria-label="Increase quantity" onClick={() => setQty(i.id, i.qty + 5)}>
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                    <p className="num w-24 text-right text-sm font-semibold">{money(i.qty * i.price)}</p>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${i.title}`}
                      className="hover:bg-bad-soft hover:text-bad-ink"
                      onClick={() => remove(i.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {items.length > 0 && suggestions.length > 0 && (
            <Card>
              <CardHeader
                title="Also running low"
                description={`${suggestions.length} more products at ${LOW_STOCK} units or fewer`}
                action={
                  <Button variant="soft" size="sm" onClick={addAll}>
                    <PackagePlus className="size-4" /> Add all
                  </Button>
                }
              />
              <ul className="flex flex-wrap gap-2 p-5 pt-4 sm:p-6 sm:pt-4">
                {suggestions.slice(0, 10).map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => add(p)}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line-strong bg-surface py-1.5 pr-3.5 pl-2 text-sm transition hover:border-accent hover:bg-accent-soft"
                    >
                      <ProductThumb src={p.thumbnail} title={p.title} className="size-6 rounded-full" />
                      <span className="max-w-[10rem] truncate">{p.title}</span>
                      <Plus className="size-3.5 text-ink-3" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader title="Order summary" />
            <div className="p-5 pt-4 text-sm sm:p-6 sm:pt-4">
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-ink-2">Products</dt>
                  <dd className="num font-medium">{totals.lines}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-2">Total units</dt>
                  <dd className="num font-medium">{totals.units}</dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-line pt-4">
                  <dt className="font-medium">Estimated cost</dt>
                  <dd className="num font-display text-2xl font-semibold tracking-tight">{money(totals.cost)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-ink-3">Calculated at list price. Your supplier price may differ.</p>
            </div>
            <div className="space-y-2 border-t border-line p-5 sm:p-6">
              <Button className="w-full" onClick={placeOrder} loading={place.isPending} disabled={items.length === 0 || !canOrder}>
                <Send className="size-4" /> Place restock order
              </Button>
              {!canOrder && <p className="text-center text-xs text-ink-3">Only admins can place orders. You can still export the list.</p>}
              <Button variant="secondary" className="w-full" onClick={exportCsv} disabled={items.length === 0}>
                <Download className="size-4" /> Export CSV
              </Button>
            </div>
          </Card>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          clear();
          setConfirmClear(false);
          toast.info("Queue cleared");
        }}
        title="Clear the whole queue?"
        description={`This removes all ${items.length} products from your restock queue.`}
        confirmLabel="Clear queue"
      />
    </>
  );
}
