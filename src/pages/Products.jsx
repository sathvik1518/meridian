import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LayoutGrid, List, PackageSearch, Plus, Search, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCategories, useProductList } from "../hooks/queries";
import { useDeleteProduct } from "../hooks/mutations";
import { useDebounce } from "../hooks/useDebounce";
import { useHotkey } from "../hooks/useHotkey";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { SORT_OPTIONS, useProductFilters } from "../hooks/useProductFilters";
import { toast } from "../store/toastStore";
import { titleCase } from "../lib/format";
import { cn } from "../lib/cn";
import ProductFormDrawer from "../components/products/ProductFormDrawer";
import ProductGrid from "../components/products/ProductGrid";
import ProductTable from "../components/products/ProductTable";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import PageHeader from "../components/ui/PageHeader";
import Pagination from "../components/ui/Pagination";
import SegmentedControl from "../components/ui/SegmentedControl";
import Skeleton from "../components/ui/Skeleton";

const selectCls =
  "h-10 cursor-pointer rounded-xl border border-line-strong bg-surface px-3 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15";
function ListSkeleton() {
  return (
    <div className="divide-y divide-line" role="status" aria-label="Loading products">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4">
          <Skeleton className="size-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
          <Skeleton className="hidden h-4 w-20 sm:block" />
          <Skeleton className="hidden h-4 w-24 md:block" />
        </div>
      ))}
    </div>
  );
}

export default function Products() {
  const { user } = useAuth();
  const canEdit = user?.role === "admin";
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { filters, query, update, clear, isFiltered } = useProductFilters();
  const [params, setParams] = useSearchParams();
  const categories = useCategories();
  const products_ = useProductList(query);
  const del = useDeleteProduct();
  // Typing updates local state at once; the URL (and so the server request) waits 350ms.
  const [search, setSearch] = useState(filters.q);
  const debounced = useDebounce(search, 350);
  const searchRef = useRef(null);
  useEffect(() => {
    if (debounced !== filters.q) update({ q: debounced.trim() });
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setSearch(filters.q), [filters.q]);
  useHotkey("/", () => searchRef.current?.focus());
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const creating = canEdit && params.get("new") === "1";
  const setCreating = (open) =>
    setParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        if (open) n.set("new", "1");
        else n.delete("new");
        return n;
      },
      { replace: true },
    );
  // Stable handlers + memoised lists: the memo()'d table/grid skip work when nothing they use changed.
  const onEdit = useCallback((p) => setEditing(p), []);
  const onDelete = useCallback((p) => setDeleting(p), []);
  const active = products_;
  const products = useMemo(() => products_.data?.items ?? [], [products_.data]);
  const total = products_.data?.total ?? 0;
  const hasData = Boolean(products_.data);
  const view = isDesktop ? filters.view : "grid";
  const categoryName = filters.category ? titleCase(filters.category) : "";
  function confirmDelete() {
    const target = deleting;
    if (!target) return;
    setDeleting(null);
    del.mutate({ id: target.id }, { onSuccess: () => toast.success("Product deleted", target.title) });
  }
  return (
    <>
      <PageHeader
        title="Products"
        description={
          hasData
            ? `${total.toLocaleString()} ${total === 1 ? "product" : "products"}${isFiltered ? " match your filters" : " in your catalogue"}.`
            : "Search, filter and manage your catalogue."
        }
        actions={
          canEdit && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" /> New product
            </Button>
          )
        }
      />

      <Card>
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="search"
                aria-label="Search products"
                placeholder="Search by name, brand or category   ( / )"
                className="h-10 w-full rounded-xl border border-line-strong bg-surface pr-3 pl-10 text-sm outline-none transition placeholder:text-ink-3 focus:border-accent focus:ring-4 focus:ring-accent/15"
              />
            </div>
            <div className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
              <select
                aria-label="Category"
                value={filters.category}
                onChange={(e) => update({ category: e.target.value })}
                className={cn(selectCls, "w-full sm:max-w-[11rem] sm:flex-1 lg:flex-none")}
              >
                <option value="">All categories</option>
                {(categories.data || []).map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Sort by"
                value={filters.sort}
                onChange={(e) => update({ sort: e.target.value })}
                className={cn(selectCls, "w-full sm:max-w-[12rem] sm:flex-1 lg:flex-none")}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {isDesktop && (
                <SegmentedControl
                  label="View"
                  value={filters.view}
                  onChange={(v) => update({ view: v }, { keepPage: true })}
                  options={[
                    { value: "table", label: "Table", icon: List, ariaLabel: "Table view" },
                    { value: "grid", label: "Grid", icon: LayoutGrid, ariaLabel: "Grid view" },
                  ]}
                />
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              label="Stock level"
              value={filters.stock}
              onChange={(v) => update({ stock: v })}
              options={[
                { value: "all", label: "All stock" },
                { value: "low", label: "Low stock" },
                { value: "out", label: "Out of stock" },
              ]}
            />
            {isFiltered && (
              <>
                {filters.q && <Chip onRemove={() => update({ q: "" })}>“{filters.q}”</Chip>}
                {categoryName && <Chip onRemove={() => update({ category: "" })}>{categoryName}</Chip>}
                <button type="button" onClick={clear} className="ml-1 cursor-pointer text-sm font-medium text-accent hover:underline">
                  Clear all
                </button>
              </>
            )}
          </div>
        </div>

        {/* Results */}
        <div
          aria-live="polite"
          aria-busy={active.isFetching}
          className={cn("transition-opacity", products_.isPlaceholderData && "opacity-60")}
        >
          {active.isPending ? (
            <ListSkeleton />
          ) : active.isError && !hasData ? (
            <ErrorState error={active.error} onRetry={() => void active.refetch()} />
          ) : products.length === 0 && !isFiltered ? (
            <EmptyState
              icon={PackageSearch}
              title="No products yet"
              description={canEdit ? "Add your first product to start building the catalogue." : "An admin hasn't added any products yet."}
              action={canEdit && <Button onClick={() => setCreating(true)}>New product</Button>}
            />
          ) : products.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No products found"
              description="Nothing matches those filters. Try a different search or clear the filters."
              action={
                <Button variant="secondary" onClick={clear}>
                  Clear filters
                </Button>
              }
            />
          ) : view === "table" ? (
            <ProductTable products={products} canEdit={canEdit} onEdit={onEdit} onDelete={onDelete} />
          ) : (
            <ProductGrid products={products} canEdit={canEdit} onEdit={onEdit} onDelete={onDelete} />
          )}
        </div>

        {products_.data && total > filters.pageSize && (
          <div className="border-t border-line p-4 sm:px-6">
            <Pagination
              page={filters.page}
              total={total}
              pageSize={filters.pageSize}
              onChange={(page) => {
                update({ page }, { keepPage: true });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        )}
      </Card>

      <ProductFormDrawer open={creating} onClose={() => setCreating(false)} mode="create" />
      {editing && <ProductFormDrawer open onClose={() => setEditing(null)} mode="edit" product={editing} />}
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete this product?"
        description={deleting ? `“${deleting.title}” will be removed from your catalogue.` : ""}
        confirmLabel="Delete product"
      />
    </>
  );
}

function Chip({ children, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft py-1 pr-1 pl-3 text-xs font-medium text-accent-ink">
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove filter"
        className="grid size-5 cursor-pointer place-items-center rounded-full hover:bg-accent/15"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}
