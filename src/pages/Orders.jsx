import { Fragment, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, Plus, Receipt, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useOrders } from "../hooks/queries";
import { useUpdateOrderStatus } from "../hooks/mutations";
import { useDebounce } from "../hooks/useDebounce";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { ORDER_PAGE_SIZE } from "../services/api";
import { toast } from "../store/toastStore";
import { compactMoney, discounted, formatDate, money, titleCase } from "../lib/format";
import { cn } from "../lib/cn";
import NewOrderDrawer from "../components/orders/NewOrderDrawer";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import PageHeader from "../components/ui/PageHeader";
import Pagination from "../components/ui/Pagination";
import ProductThumb from "../components/ui/ProductThumb";
import SegmentedControl from "../components/ui/SegmentedControl";
import Skeleton from "../components/ui/Skeleton";

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "total-desc", label: "Highest value" },
  { value: "total-asc", label: "Lowest value" },
];

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

const STATUS_TONE = { pending: "neutral", processing: "info", shipped: "accent", delivered: "ok", cancelled: "bad" };

const orderNo = (id) => `#ORD-${String(id).padStart(4, "0")}`;

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
      <p className="text-sm text-ink-2">{label}</p>
      <p className="num mt-1.5 font-display text-3xl leading-none font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-[13px] text-ink-3">{sub}</p>
    </div>
  );
}

function LineItems({ order }) {
  return (
    <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
      {order.items.map((l, i) => (
        <li key={`${l.productId}-${i}`} className="flex items-center gap-3 p-3">
          <ProductThumb src={l.thumbnail} title={l.title} className="size-10" />
          <span className="min-w-0 flex-1 truncate text-sm">{l.title}</span>
          <span className="num text-sm text-ink-3">
            {l.quantity} × {money(discounted(l.price, l.discountPercentage))}
          </span>
          <span className="num w-24 text-right text-sm font-medium">{money(discounted(l.price, l.discountPercentage) * l.quantity)}</span>
        </li>
      ))}
    </ul>
  );
}
/** Admins get a drop-down to move an order along; everyone else just sees the badge. */
function StatusControl({ order, canEdit }) {
  const update = useUpdateOrderStatus();
  if (!canEdit)
    return (
      <Badge tone={STATUS_TONE[order.status]} dot>
        {titleCase(order.status)}
      </Badge>
    );
  return (
    <select
      aria-label={`Status of order ${orderNo(order.id)}`}
      value={order.status}
      onChange={(e) =>
        update.mutate(
          { id: order.id, status: e.target.value },
          { onSuccess: () => toast.success(`Order ${orderNo(order.id)} updated`, `Marked as ${e.target.value}`) },
        )
      }
      className="h-8 cursor-pointer rounded-lg border border-line-strong bg-surface px-2 text-xs font-medium outline-none focus:border-accent focus:ring-4 focus:ring-accent/15"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {titleCase(s)}
        </option>
      ))}
    </select>
  );
}

export default function Orders() {
  const { user } = useAuth();
  const canEdit = user?.role === "admin";
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(null);
  const [ordering, setOrdering] = useState(false);
  // Filters live in the URL, exactly like the Products page.
  const status = STATUSES.includes(params.get("status") ?? "") ? params.get("status") : "all";
  const sort = SORTS.some((s) => s.value === params.get("sort")) ? params.get("sort") : "newest";
  const page = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
  const q = params.get("q") ?? "";
  const set = (patch, keepPage = false) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(patch).forEach(([k, v]) =>
          v === "" || v === "all" || v === 1 || (k === "sort" && v === "newest") ? next.delete(k) : next.set(k, String(v)),
        );
        if (!keepPage) next.delete("page");
        return next;
      },
      { replace: true },
    );
  const [search, setSearch] = useState(q);
  const debounced = useDebounce(search, 300);
  useEffect(() => {
    if (debounced.trim() !== q) set({ q: debounced.trim() });
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setSearch(q), [q]);
  const orders = useOrders({ q, status, sort, page, pageSize: ORDER_PAGE_SIZE });
  const rows = orders.data?.items ?? [];
  const stats = orders.data?.stats;
  return (
    <>
      <PageHeader
        title="Orders"
        description="Every customer order with its items, status and total."
        actions={
          canEdit && (
            <Button onClick={() => setOrdering(true)}>
              <Plus className="size-4" /> New order
            </Button>
          )
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {!stats ? (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[7.5rem] rounded-2xl" />)
        ) : (
          <>
            <Stat
              label="Orders"
              value={stats.total.toLocaleString()}
              sub={`${stats.byStatus.pending + stats.byStatus.processing} still open`}
            />
            <Stat label="Revenue" value={compactMoney(stats.revenue)} sub="excluding cancelled orders" />
            <Stat label="Average order" value={money(stats.avgOrder)} sub="revenue ÷ orders" />
            <Stat
              label="Cancelled"
              value={stats.byStatus.cancelled}
              sub={`${stats.total ? Math.round((stats.byStatus.cancelled / stats.total) * 100) : 0}% of all orders`}
            />
          </>
        )}
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="search"
                aria-label="Search orders"
                placeholder="Search by customer, email or order number"
                className="h-10 w-full rounded-xl border border-line-strong bg-surface pr-3 pl-10 text-sm outline-none placeholder:text-ink-3 focus:border-accent focus:ring-4 focus:ring-accent/15"
              />
            </div>
            <select
              aria-label="Sort orders"
              value={sort}
              onChange={(e) => set({ sort: e.target.value })}
              className="h-10 cursor-pointer rounded-xl border border-line-strong bg-surface px-3 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/15"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="-mx-1 overflow-x-auto px-1">
            <SegmentedControl
              label="Order status"
              value={status}
              onChange={(v) => set({ status: v })}
              options={[{ value: "all", label: "All" }, ...STATUSES.map((s) => ({ value: s, label: titleCase(s) }))]}
            />
          </div>
        </div>

        <div
          aria-live="polite"
          aria-busy={orders.isFetching}
          className={cn("transition-opacity", orders.isPlaceholderData && "opacity-60")}
        >
          {orders.isPending ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : orders.isError ? (
            <ErrorState error={orders.error} onRetry={() => void orders.refetch()} />
          ) : rows.length === 0 ? (
            q === "" && status === "all" ? (
              <EmptyState
                icon={Receipt}
                title="No orders yet"
                description={
                  canEdit
                    ? "Place your first order. Pick the products and enter the customer."
                    : "Orders will show up here once an admin adds them."
                }
                action={canEdit && <Button onClick={() => setOrdering(true)}>New order</Button>}
              />
            ) : (
              <EmptyState icon={Receipt} title="No orders found" description="Try a different customer, order number or status." />
            )
          ) : isDesktop ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[50rem] text-left text-sm">
                <caption className="sr-only">Orders. Use the arrow button on a row to see its items.</caption>
                <thead>
                  <tr className="border-b border-line text-xs tracking-wide text-ink-3 uppercase">
                    <th scope="col" className="px-6 py-3 font-semibold">
                      Order
                    </th>
                    <th scope="col" className="px-3 py-3 font-semibold">
                      Customer
                    </th>
                    <th scope="col" className="px-3 py-3 font-semibold">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-3 font-semibold">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">
                      Items
                    </th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">
                      Total
                    </th>
                    <th scope="col" className="w-14 px-6 py-3">
                      <span className="sr-only">Expand</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => {
                    const isOpen = open === o.id;
                    return (
                      <Fragment key={o.id}>
                        <tr className={cn("border-b border-line transition-colors hover:bg-surface-2/70", isOpen && "bg-surface-2/70")}>
                          <td className="num px-6 py-3.5 font-medium">{orderNo(o.id)}</td>
                          <td className="px-3 py-3.5">
                            <span className="flex items-center gap-3">
                              <Avatar name={o.customer.name} size="sm" />
                              <span>
                                <span className="block font-medium">{o.customer.name}</span>
                                <span className="block text-xs text-ink-3">{o.customer.city}</span>
                              </span>
                            </span>
                          </td>
                          <td className="px-3 py-3.5 whitespace-nowrap text-ink-2">{formatDate(o.createdAt)}</td>
                          <td className="px-3 py-3.5">
                            <StatusControl order={o} canEdit={canEdit} />
                          </td>
                          <td className="num px-3 py-3.5 text-right text-ink-2">{o.itemCount}</td>
                          <td className="num px-3 py-3.5 text-right font-semibold">{money(o.total)}</td>
                          <td className="px-6 py-3.5 text-right">
                            <button
                              type="button"
                              aria-expanded={isOpen}
                              aria-controls={`order-${o.id}`}
                              aria-label={`${isOpen ? "Hide" : "Show"} items in order ${orderNo(o.id)}`}
                              onClick={() => setOpen(isOpen ? null : o.id)}
                              className="grid size-8 cursor-pointer place-items-center rounded-lg text-ink-2 transition hover:bg-line"
                            >
                              <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
                            </button>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr className="border-b border-line bg-surface-2/40">
                            <td colSpan={7} id={`order-${o.id}`} className="animate-fade-in px-6 py-4">
                              <LineItems order={o} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {rows.map((o) => {
                const isOpen = open === o.id;
                return (
                  <li key={o.id} className="p-4">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? null : o.id)}
                      className="flex w-full cursor-pointer items-center gap-3 text-left"
                    >
                      <Avatar name={o.customer.name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{o.customer.name}</span>
                        <span className="num text-xs text-ink-3">
                          {orderNo(o.id)} · {o.itemCount} items · {formatDate(o.createdAt)}
                        </span>
                      </span>
                      <span className="num text-sm font-semibold">{money(o.total)}</span>
                      <ChevronDown className={cn("size-4 text-ink-3 transition-transform", isOpen && "rotate-180")} />
                    </button>
                    <div className="mt-2 pl-11">
                      <StatusControl order={o} canEdit={canEdit} />
                    </div>
                    {isOpen && (
                      <div className="animate-fade-in mt-3">
                        <LineItems order={o} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {orders.data && orders.data.total > ORDER_PAGE_SIZE && (
          <div className="border-t border-line p-4 sm:px-6">
            <Pagination page={page} total={orders.data.total} pageSize={ORDER_PAGE_SIZE} onChange={(p) => set({ page: p }, true)} />
          </div>
        )}
      </Card>
      {ordering && <NewOrderDrawer open onClose={() => setOrdering(false)} />}
    </>
  );
}
