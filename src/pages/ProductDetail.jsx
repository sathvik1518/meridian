import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Minus, PackageX, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDeleteProduct, useUpdateProduct } from "../hooks/mutations";
import { useProduct } from "../hooks/queries";
import { ApiError } from "../services/api";
import { toast } from "../store/toastStore";
import { discounted, formatDate, money, stockStatus, titleCase } from "../lib/format";
import PriceTag from "../components/products/PriceTag";
import ProductFormDrawer from "../components/products/ProductFormDrawer";
import QueueButton from "../components/products/QueueButton";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card, { CardHeader } from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import PageHeader from "../components/ui/PageHeader";
import ProductThumb from "../components/ui/ProductThumb";
import Skeleton from "../components/ui/Skeleton";
import Stars from "../components/ui/Stars";

function Spec({ label, children }) {
  if (children === undefined || children === null || children === "") return null;
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line py-3 last:border-0">
      <dt className="text-sm text-ink-2">{label}</dt>
      <dd className="num text-right text-sm font-medium">{children}</dd>
    </div>
  );
}

function StockControl({ product }) {
  const { user } = useAuth();
  const update = useUpdateProduct();
  const canEdit = user?.role === "admin";
  const status = stockStatus(product.stock);
  const adjust = (delta) => {
    const next = Math.max(0, (product.stock || 0) + delta);
    if (next !== product.stock) update.mutate({ id: product.id, patch: { stock: next } });
  };
  const btn = "size-11 sm:size-10";
  return (
    <Card>
      <CardHeader
        title="Inventory"
        description={canEdit ? "Changes appear instantly and roll back if saving fails." : "Viewers can look but not change stock."}
        action={
          <Badge tone={status.tone} dot>
            {status.label}
          </Badge>
        }
      />
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="num font-display text-5xl leading-none font-semibold tracking-tight">{product.stock ?? 0}</p>
          <p className="mt-1.5 text-sm text-ink-2">
            units in stock{update.isPending && <span className="ml-2 text-ink-3">· saving…</span>}
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2" role="group" aria-label="Adjust stock">
            <Button
              variant="secondary"
              size="icon"
              className={btn}
              onClick={() => adjust(-10)}
              aria-label="Remove 10 units"
              disabled={product.stock <= 0}
            >
              <span className="num text-xs font-semibold">−10</span>
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className={btn}
              onClick={() => adjust(-1)}
              aria-label="Remove 1 unit"
              disabled={product.stock <= 0}
            >
              <Minus className="size-4" />
            </Button>
            <Button variant="secondary" size="icon" className={btn} onClick={() => adjust(1)} aria-label="Add 1 unit">
              <Plus className="size-4" />
            </Button>
            <Button variant="secondary" size="icon" className={btn} onClick={() => adjust(10)} aria-label="Add 10 units">
              <span className="num text-xs font-semibold">+10</span>
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function ProductDetail() {
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role === "admin";
  const { data: product, isPending, isError, error, refetch } = useProduct(productId);
  const del = useDeleteProduct();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const back = location.state?.from || "/products";
  if (isError && error instanceof ApiError && error.status === 404) {
    return (
      <Card>
        <PageHeader title="Product not found" documentTitle="Not found" />
        <EmptyState
          icon={PackageX}
          title={`There's no product with ID ${productId}`}
          description="It may have been deleted, or the link is wrong."
          action={
            <Link to="/products">
              <Button>Back to products</Button>
            </Link>
          }
        />
      </Card>
    );
  }
  if (isError)
    return (
      <Card>
        <ErrorState error={error} onRetry={() => void refetch()} />
      </Card>
    );
  if (isPending) {
    return (
      <div className="grid gap-6 lg:grid-cols-2" role="status" aria-label="Loading product">
        <Skeleton className="aspect-square rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-24" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    );
  }
  const status = stockStatus(product.stock);
  const salePrice = discounted(product.price, product.discountPercentage);
  function confirmDelete() {
    if (!product) return;
    setConfirming(false);
    navigate(back, { replace: true });
    del.mutate({ id: product.id }, { onSuccess: () => toast.success("Product deleted", product.title) });
  }
  return (
    <>
      <Link to={back} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to products
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] xl:gap-8">
        <div className="aspect-square overflow-hidden rounded-2xl border border-line bg-surface-2">
          <ProductThumb
            src={product.thumbnail}
            alt={product.title}
            title={product.title}
            size="lg"
            eager
            className="rounded-none border-0 bg-transparent"
          />
        </div>

        <div className="space-y-5">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone="accent">{titleCase(product.category)}</Badge>
              <Badge tone={status.tone} dot>
                {status.label}
              </Badge>
            </div>
            <PageHeader
              compact
              title={product.title}
              documentTitle={product.title}
              description={product.brand ? `by ${product.brand}` : undefined}
            />
            <div className="flex flex-wrap items-center gap-4">
              <Stars value={product.rating} />
              <span className="num text-sm text-ink-3">SKU {product.sku}</span>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <PriceTag price={product.price} discount={product.discountPercentage} size="lg" />
              {product.discountPercentage > 0.5 && <Badge tone="ok">Save {Math.round(product.discountPercentage)}%</Badge>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <QueueButton product={product} variant="full" />
            {canEdit && (
              <>
                <Button variant="secondary" onClick={() => setEditing(true)}>
                  <Pencil className="size-4" /> Edit
                </Button>
                <Button variant="ghost" className="text-bad-ink hover:bg-bad-soft dark:text-bad" onClick={() => setConfirming(true)}>
                  <Trash2 className="size-4" /> Delete
                </Button>
              </>
            )}
          </div>

          <StockControl product={product} />

          <Card>
            <CardHeader title="About this product" />
            <p className="p-5 pt-3 leading-relaxed text-ink-2 sm:p-6 sm:pt-3">{product.description || "No description yet."}</p>
          </Card>
        </div>
      </div>

      <Card className="mt-6 xl:mt-8">
        <CardHeader title="Details" />
        <div className="grid gap-x-12 p-5 pt-2 sm:p-6 sm:pt-2 md:grid-cols-2">
          <dl>
            <Spec label="Brand">{product.brand}</Spec>
            <Spec label="Category">{titleCase(product.category)}</Spec>
            <Spec label="SKU">{product.sku}</Spec>
            <Spec label="Rating">{product.rating ? `${product.rating.toFixed(1)} / 5` : "Not rated yet"}</Spec>
          </dl>
          <dl>
            <Spec label="List price">{money(product.price)}</Spec>
            <Spec label="Selling price">{money(salePrice)}</Spec>
            <Spec label="Value of stock on hand">{money(salePrice * product.stock)}</Spec>
            <Spec label="Added">{formatDate(product.createdAt)}</Spec>
            <Spec label="Last updated">{formatDate(product.updatedAt)}</Spec>
          </dl>
        </div>
      </Card>

      {editing && <ProductFormDrawer open onClose={() => setEditing(false)} mode="edit" product={product} />}
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={confirmDelete}
        title="Delete this product?"
        description={`“${product.title}” will be removed from your catalogue.`}
        confirmLabel="Delete product"
      />
    </>
  );
}
