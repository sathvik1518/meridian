import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  ClipboardList,
  DollarSign,
  PackageOpen,
  Plus,
  ShoppingCart,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useActivity, useSummary } from "../hooks/queries";
import { useCountUp } from "../hooks/useCountUp";
import { useLoadDemo } from "../hooks/mutations";
import { useQueueCount } from "../store/restockStore";
import { toast } from "../store/toastStore";
import { LOW_STOCK, compactMoney, greeting, money, timeAgo, titleCase } from "../lib/format";
import { cn } from "../lib/cn";
import BarList from "../components/charts/BarList";
import DonutChart from "../components/charts/DonutChart";
import Histogram from "../components/charts/Histogram";
import RevenueChart from "../components/charts/RevenueChart";
import ErrorBoundary from "../components/layout/ErrorBoundary";
import QueueButton from "../components/products/QueueButton";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Card, { CardHeader } from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import PageHeader from "../components/ui/PageHeader";
import ProductThumb from "../components/ui/ProductThumb";
import Skeleton from "../components/ui/Skeleton";
import Stars from "../components/ui/Stars";

const TONES = {
  accent: "bg-accent-soft text-accent-ink",
  ok: "bg-ok-soft text-ok-ink",
  warn: "bg-warn-soft text-warn-ink",
  info: "bg-info-soft text-info-ink",
};

function Trend({ value }) {
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "num inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
        up ? "bg-ok-soft text-ok-ink" : "bg-bad-soft text-bad-ink",
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {Math.abs(value).toFixed(0)}%<span className="sr-only"> {up ? "up" : "down"} compared with the previous 30 days</span>
    </span>
  );
}

// React.memo: a KPI only redraws when ITS numbers change, not on every dashboard update.
const Kpi = memo(function Kpi({ icon: Icon, label, value, format, sub, to, tone = "accent", delay = 0, title, trend }) {
  const n = useCountUp(value);
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className={cn("grid size-10 place-items-center rounded-xl", TONES[tone])}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {trend !== null && trend !== undefined ? (
          <Trend value={trend} />
        ) : to ? (
          <ArrowUpRight
            className="size-4 text-ink-3 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink"
            aria-hidden="true"
          />
        ) : null}
      </div>
      <p className="mt-4 text-sm text-ink-2 sm:mt-5">{label}</p>
      <p className="num mt-1 font-display text-[1.65rem] leading-none font-semibold tracking-tight sm:text-[2rem]" title={title}>
        {format(n)}
      </p>
      <p className="mt-2 text-[13px] text-ink-3">{sub}</p>
    </>
  );
  const cls = "group animate-rise block rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-6";
  return to ? (
    <Link
      to={to}
      className={cn(cls, "transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-pop)]")}
      style={{ animationDelay: `${delay}ms` }}
    >
      {body}
    </Link>
  ) : (
    <div className={cls} style={{ animationDelay: `${delay}ms` }}>
      {body}
    </div>
  );
});

function DashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading dashboard">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[11.5rem] rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}

const pct = (current, previous) => (previous > 0 ? ((current - previous) / previous) * 100 : null);

function ActivityFeed() {
  const activity = useActivity(); // its own query: this card loads (and fails) independently of the rest
  return (
    <Card>
      <CardHeader title="Recent activity" description="What your team changed" />
      <div className="p-2 pt-3 sm:p-3">
        {activity.isPending ? (
          <div className="space-y-2 p-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : activity.isError ? (
          <ErrorState error={activity.error} onRetry={() => void activity.refetch()} className="py-8" title="Activity unavailable" />
        ) : (
          <ul>
            {activity.data.slice(0, 7).map((a) => (
              <li key={a.id} className="flex items-start gap-3 rounded-xl p-3">
                <Avatar name={a.userName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{a.userName}</span> {a.action}{" "}
                    {a.entity === "restock" ? "a restock order" : `a ${a.entity}`}
                  </p>
                  <p className="truncate text-xs text-ink-3">{a.detail || "—"}</p>
                </div>
                <time className="num shrink-0 text-xs text-ink-3" dateTime={a.createdAt}>
                  {timeAgo(a.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

function Widgets({ data }) {
  const { kpis, stockHealth } = data;
  const categories = useMemo(
    () =>
      data.byCategory
        .filter((c) => c.value > 0)
        .slice(0, 8)
        .map((c) => ({ label: c.name, value: Math.round(c.value), href: `/products?category=${c.slug}` })),
    [data.byCategory],
  );
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi
          icon={DollarSign}
          label="Revenue, last 30 days"
          value={kpis.revenue30d}
          format={compactMoney}
          title={money(kpis.revenue30d)}
          trend={pct(kpis.revenue30d, kpis.revenuePrev30d)}
          sub={`${money(kpis.avgOrderValue)} average order`}
          tone="ok"
          to="/orders"
        />
        <Kpi
          icon={ShoppingCart}
          label="Orders, last 30 days"
          value={kpis.orders30d}
          format={(n) => Math.round(n).toLocaleString()}
          trend={pct(kpis.orders30d, kpis.ordersPrev30d)}
          sub="cancelled orders excluded"
          tone="info"
          delay={60}
          to="/orders"
        />
        <Kpi
          icon={Wallet}
          label="Inventory value"
          value={kpis.inventoryValue}
          format={compactMoney}
          title={money(kpis.inventoryValue)}
          sub={`${kpis.productCount} ${kpis.productCount === 1 ? "product" : "products"} in stock records`}
          tone="accent"
          delay={120}
        />
        <Kpi
          icon={TriangleAlert}
          label="Needs attention"
          value={kpis.lowStock + kpis.outOfStock}
          format={(n) => String(Math.round(n))}
          sub={`${kpis.outOfStock} out of stock · ${kpis.lowStock} running low`}
          to="/products?sort=stock-asc"
          tone="warn"
          delay={180}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue" description="Daily sales over the last 30 days" />
          <div className="p-5 pt-6 sm:p-6">
            <ErrorBoundary variant="card" label="The revenue chart">
              <RevenueChart data={data.revenueByDay} />
            </ErrorBoundary>
          </div>
        </Card>
        <Card className="flex flex-col">
          <CardHeader title="Stock health" description={`Low means ${LOW_STOCK} units or fewer`} />
          <div className="flex flex-1 items-center justify-center p-5 pt-6 sm:p-6">
            <DonutChart
              stacked
              label={`Stock health: ${stockHealth.healthy} healthy, ${stockHealth.low} low, ${stockHealth.out} out of stock`}
              centerValue={kpis.productCount}
              centerLabel="products"
              segments={[
                { label: "Healthy", value: stockHealth.healthy, color: "var(--ok)" },
                { label: "Running low", value: stockHealth.low, color: "var(--warn)" },
                { label: "Out of stock", value: stockHealth.out, color: "var(--bad)" },
              ]}
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Inventory value by category" description="Select a category to see its products" />
          <div className="p-5 pt-5 sm:p-6">
            <BarList items={categories} format={compactMoney} label="Inventory value by category" />
          </div>
        </Card>
        <ErrorBoundary variant="card" label="Recent activity">
          <ActivityFeed />
        </ErrorBoundary>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Needs restocking soon"
            description="Lowest stock first · add straight to your queue"
            action={
              <Link to="/products?stock=low" className="text-sm font-medium text-accent hover:underline">
                See all low stock
              </Link>
            }
          />
          <ul className="p-2 pt-3 sm:p-3">
            {data.lowStockItems.length === 0 && <li className="p-6 text-center text-sm text-ink-2">Everything is well stocked.</li>}
            {data.lowStockItems.map((p) => (
              <li key={p.id} className="flex items-center gap-3.5 rounded-xl p-3 transition hover:bg-surface-2">
                <ProductThumb src={p.thumbnail} title={p.title} />
                <div className="min-w-0 flex-1">
                  <Link to={`/products/${p.id}`} className="block truncate text-sm font-medium hover:text-accent">
                    {p.title}
                  </Link>
                  <p className="text-xs text-ink-3">{titleCase(p.category)}</p>
                </div>
                <span
                  className={cn(
                    "num rounded-full px-2.5 py-1 text-xs font-semibold",
                    p.stock <= 0 ? "bg-bad-soft text-bad-ink" : "bg-warn-soft text-warn-ink",
                  )}
                >
                  {p.stock <= 0 ? "Out" : `${p.stock} left`}
                </span>
                <QueueButton product={p} />
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Top rated" description="Customer favourites" />
          <ul className="p-2 pt-3 sm:p-3">
            {data.topRated.map((p, i) => (
              <li key={p.id}>
                <Link to={`/products/${p.id}`} className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-surface-2">
                  <span className="num w-4 text-center text-sm font-semibold text-ink-3">{i + 1}</span>
                  <ProductThumb src={p.thumbnail} title={p.title} className="size-9" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.title}</span>
                    <Stars value={p.rating} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Price distribution" description="How many products sit in each price band (after discount)" />
          <div className="p-5 pt-8 sm:p-6 sm:pt-8">
            <Histogram bins={data.priceBuckets} label="Number of products in each price band" />
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Latest orders"
            description="Most recent first"
            action={
              <Link to="/orders" className="text-sm font-medium text-accent hover:underline">
                View all
              </Link>
            }
          />
          <ul className="p-2 pt-3 sm:p-3">
            {data.recentOrders.map((o) => (
              <li key={o.id}>
                <Link to={`/orders?q=${o.id}`} className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-surface-2">
                  <Avatar name={o.customer.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{o.customer.name}</p>
                    <p className="num text-xs text-ink-3">
                      #{String(o.id).padStart(4, "0")} · {o.itemCount} items · {titleCase(o.status)}
                    </p>
                  </div>
                  <p className="num text-sm font-semibold">{money(o.total)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

// Shown instead of empty charts when there is no data yet.
function EmptyWorkspace({ isAdmin }) {
  const load = useLoadDemo();
  return (
    <Card>
      <EmptyState
        icon={PackageOpen}
        title="Your workspace is empty"
        description={
          isAdmin
            ? "Add your own products and place orders, and this dashboard fills in by itself. Or load sample data to look around."
            : "Once an admin adds products and orders, the dashboard shows up here."
        }
        action={
          isAdmin && (
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/products?new=1">
                <Button>
                  <Plus className="size-4" /> Add your first product
                </Button>
              </Link>
              <Button
                variant="secondary"
                loading={load.isPending}
                onClick={() => load.mutate(undefined, { onError: (e) => toast.error("Couldn't load sample data", e.message) })}
              >
                Load sample data
              </Button>
            </div>
          )
        }
      />
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const summary = useSummary();
  const queueCount = useQueueCount();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  return (
    <>
      <PageHeader
        documentTitle="Dashboard"
        eyebrow={today}
        title={`${greeting()}, ${user?.name.split(" ")[0]}`}
        description="Here's how sales and stock are doing right now."
        actions={
          <>
            <Link to="/restock">
              <Button variant="secondary">
                <ClipboardList className="size-4" /> Restock queue
                {queueCount > 0 && <span className="num rounded-full bg-accent px-1.5 text-xs text-on-accent">{queueCount}</span>}
              </Button>
            </Link>
            {user?.role === "admin" && (
              <Link to="/products?new=1">
                <Button>
                  <Plus className="size-4" /> New product
                </Button>
              </Link>
            )}
          </>
        }
      />

      {summary.isPending && <DashboardSkeleton />}
      {summary.isError && (
        <Card>
          <ErrorState error={summary.error} onRetry={() => void summary.refetch()} />
        </Card>
      )}
      {summary.data && summary.data.kpis.productCount === 0 && <EmptyWorkspace isAdmin={user?.role === "admin"} />}
      {summary.data && summary.data.kpis.productCount > 0 && <Widgets data={summary.data} />}
    </>
  );
}
