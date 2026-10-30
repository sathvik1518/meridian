import { Form, Formik } from "formik";
import { useCategories } from "../../hooks/queries";
import { emptyProduct, productSchema } from "../../validation/productSchema";
import { titleCase } from "../../lib/format";
import Button from "../ui/Button";
import { SelectField, TextAreaField, TextField } from "../ui/fields";

// One form for both "create" and "edit". Formik holds the values, Yup validates them.
export default function ProductForm({ initial, onSubmit, onCancel, submitLabel = "Save product" }) {
  const categories = useCategories();
  const options = (categories.data || []).map((c) => ({ value: c.slug, label: c.name }));
  // Make sure the product's current category is selectable even before the list arrives.
  if (initial?.category && !options.some((o) => o.value === initial.category))
    options.unshift({ value: initial.category, label: titleCase(initial.category) });
  return (
    <Formik
      initialValues={{ ...emptyProduct, ...initial }}
      validationSchema={productSchema}
      onSubmit={(values, helpers) => {
        // The inputs hold text while typing; here we turn it into the exact types the API expects.
        const cast = productSchema.cast(values);
        return onSubmit(
          {
            title: cast.title,
            brand: cast.brand ?? "",
            category: cast.category,
            description: cast.description,
            price: cast.price,
            stock: cast.stock,
            discountPercentage: cast.discountPercentage ?? 0,
          },
          helpers,
        );
      }}
    >
      {({ isSubmitting, dirty }) => (
        <Form noValidate className="flex min-h-full flex-col">
          <div className="flex-1 space-y-5">
            <TextField name="title" label="Product name" placeholder="e.g. Wireless Noise-Cancelling Headphones" data-autofocus />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField name="brand" label="Brand" optional placeholder="e.g. Acme" />
              <SelectField
                name="category"
                label="Category"
                options={options}
                placeholder={categories.isPending ? "Loading…" : "Select a category"}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <TextField
                name="price"
                label="Price"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                suffix="USD"
                placeholder="24.99"
              />
              <TextField name="stock" label="Units in stock" type="number" inputMode="numeric" step="1" min="0" placeholder="40" />
              <TextField
                name="discountPercentage"
                label="Discount"
                type="number"
                inputMode="decimal"
                step="0.5"
                min="0"
                max="90"
                suffix="%"
                optional
              />
            </div>
            <TextAreaField name="description" label="Description" hint="What is it, and who is it for? 10 to 500 characters." />
          </div>
          <div className="sticky bottom-0 -mx-6 mt-8 flex justify-end gap-2 border-t border-line bg-surface px-6 py-4">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={!dirty}>
              {submitLabel}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
