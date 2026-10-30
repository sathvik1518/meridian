import { useState } from "react";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { Minus, Plus, Search, Trash2 } from "lucide-react";
import { useProductSuggest } from "../../hooks/queries";
import { useCreateOrder } from "../../hooks/mutations";
import { useDebounce } from "../../hooks/useDebounce";
import { toast } from "../../store/toastStore";
import { discounted, money } from "../../lib/format";
import Button from "../ui/Button";
import Drawer from "../ui/Drawer";
import ProductThumb from "../ui/ProductThumb";
import { TextField } from "../ui/fields";

// Formik + Yup check the customer part. The product lines live in normal React state.
const customerSchema = Yup.object({
  name: Yup.string().trim().min(2, "Name is too short").max(60).required("Enter the customer's name"),
  email: Yup.string().trim().email("That doesn't look like an email address").required("Enter the customer's email"),
  city: Yup.string().trim().max(60),
});

export default function NewOrderDrawer({ open, onClose }) {
  const create = useCreateOrder();
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState([]); // [{ product, quantity }]
  const suggestions = useProductSuggest(useDebounce(search, 250));

  const total = lines.reduce((sum, l) => sum + discounted(l.product.price, l.product.discountPercentage) * l.quantity, 0);

  function addProduct(product) {
    setLines((prev) => {
      const hit = prev.find((l) => l.product.id === product.id);
      if (!hit) return [...prev, { product, quantity: 1 }];
      return prev.map((l) => (l === hit ? { ...l, quantity: Math.min(l.product.stock, l.quantity + 1) } : l));
    });
  }
  const setQty = (id, quantity) =>
    setLines((prev) =>
      prev.map((l) => (l.product.id === id ? { ...l, quantity: Math.max(1, Math.min(l.product.stock, quantity || 1)) } : l)),
    );
  const remove = (id) => setLines((prev) => prev.filter((l) => l.product.id !== id));

  async function submit(values, helpers) {
    if (lines.length === 0) {
      helpers.setStatus("Add at least one product to the order.");
      helpers.setSubmitting(false);
      return;
    }
    try {
      const order = await create.mutateAsync({
        customer: { name: values.name, email: values.email, city: values.city || "" },
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      });
      toast.success("Order placed", `${money(order.total)} for ${values.name}`);
      onClose();
    } catch (error) {
      // For example: "Only 2 left of Desk Lamp. Lower the quantity."
      helpers.setStatus(error instanceof Error ? error.message : "Couldn't place the order.");
      helpers.setSubmitting(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="New order"
      description="Pick the products and enter the customer. Stock goes down automatically."
    >
      <Formik initialValues={{ name: "", email: "", city: "" }} validationSchema={customerSchema} onSubmit={submit}>
        {({ isSubmitting, status }) => (
          <Form noValidate className="flex min-h-full flex-col">
            <div className="flex-1 space-y-6">
              <fieldset className="space-y-5">
                <legend className="mb-3 text-xs font-semibold tracking-wide text-ink-3 uppercase">Customer</legend>
                <TextField name="name" label="Customer name" placeholder="e.g. Asha Rao" data-autofocus autoComplete="off" />
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField name="email" type="email" label="Email" placeholder="asha@example.com" autoComplete="off" />
                  <TextField name="city" label="City" optional placeholder="Hyderabad" autoComplete="off" />
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-3 text-xs font-semibold tracking-wide text-ink-3 uppercase">Products</legend>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search products to add"
                    placeholder="Search by name, brand or SKU"
                    className="h-11 w-full rounded-xl border border-line-strong bg-surface pr-3 pl-10 text-sm outline-none transition placeholder:text-ink-3 focus:border-accent focus:ring-4 focus:ring-accent/15"
                  />
                </div>

                {search.trim().length >= 2 && (
                  <ul
                    className="mt-2 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface"
                    aria-label="Matching products"
                  >
                    {suggestions.isPending && <li className="p-3 text-sm text-ink-3">Searching…</li>}
                    {suggestions.data?.length === 0 && <li className="p-3 text-sm text-ink-3">No products match “{search.trim()}”.</li>}
                    {suggestions.data?.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          disabled={p.stock === 0}
                          onClick={() => addProduct(p)}
                          className="flex w-full cursor-pointer items-center gap-3 p-3 text-left transition hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <ProductThumb src={p.thumbnail} title={p.title} className="size-9" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{p.title}</span>
                            <span className="num text-xs text-ink-3">
                              {money(discounted(p.price, p.discountPercentage))} · {p.stock === 0 ? "Out of stock" : `${p.stock} in stock`}
                            </span>
                          </span>
                          {p.stock > 0 && <Plus className="size-4 text-accent" aria-hidden="true" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {lines.length === 0 ? (
                  <p className="mt-4 rounded-xl border border-dashed border-line-strong p-4 text-center text-sm text-ink-3">
                    No products yet. Search above and click one to add it.
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-surface" aria-label="Order items">
                    {lines.map(({ product, quantity }) => (
                      <li key={product.id} className="flex items-center gap-3 p-3">
                        <ProductThumb src={product.thumbnail} title={product.title} className="size-10" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{product.title}</p>
                          <p className="num text-xs text-ink-3">
                            {money(discounted(product.price, product.discountPercentage))} each · max {product.stock}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="secondary"
                            size="icon-sm"
                            aria-label={`Fewer ${product.title}`}
                            onClick={() => setQty(product.id, quantity - 1)}
                          >
                            <Minus className="size-3.5" />
                          </Button>
                          <span className="num w-7 text-center text-sm font-medium" aria-label={`Quantity of ${product.title}`}>
                            {quantity}
                          </span>
                          <Button
                            variant="secondary"
                            size="icon-sm"
                            aria-label={`More ${product.title}`}
                            onClick={() => setQty(product.id, quantity + 1)}
                          >
                            <Plus className="size-3.5" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon-sm" aria-label={`Remove ${product.title}`} onClick={() => remove(product.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </fieldset>

              {status && (
                <p role="alert" className="rounded-xl bg-bad-soft px-4 py-3 text-sm text-bad-ink">
                  {status}
                </p>
              )}
            </div>

            <div className="sticky bottom-0 -mx-6 mt-8 flex items-center justify-between gap-3 border-t border-line bg-surface px-6 py-4">
              <p className="text-sm text-ink-2">
                Total <span className="num ml-1 font-display text-lg font-semibold text-ink">{money(total)}</span>
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  Place order
                </Button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </Drawer>
  );
}
