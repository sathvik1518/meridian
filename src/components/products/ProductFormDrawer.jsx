import { useNavigate } from "react-router-dom";
import { useCreateProduct, useUpdateProduct } from "../../hooks/mutations";
import { toast } from "../../store/toastStore";
import Drawer from "../ui/Drawer";
import ProductForm from "./ProductForm";

// mode="create" -> POST a new product.  mode="edit" -> PATCH changes (optimistic).
export default function ProductFormDrawer({ open, onClose, mode = "create", product }) {
  const navigate = useNavigate();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const editing = mode === "edit" && Boolean(product);
  async function handleSubmit(values, helpers) {
    try {
      if (editing && product) {
        // Close right away: the screen already shows the new values (optimistic update).
        update.mutate({ id: product.id, patch: values }, { onSuccess: () => toast.success("Product updated", values.title) });
        onClose();
      } else {
        const created = await create.mutateAsync(values);
        toast.success("Product created", values.title);
        onClose();
        navigate(`/products/${created.id}`);
      }
    } catch (error) {
      toast.error("Couldn't save the product", error instanceof Error ? error.message : undefined);
      helpers.setSubmitting(false);
    }
  }
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? "Edit product" : "New product"}
      description={editing ? "Changes show instantly and roll back if saving fails." : "Add a product to the catalogue."}
    >
      <ProductForm
        initial={
          editing && product
            ? {
                title: product.title,
                brand: product.brand || "",
                category: product.category,
                price: product.price,
                stock: product.stock,
                discountPercentage: product.discountPercentage ?? 0,
                description: product.description || "",
              }
            : undefined
        }
        onSubmit={handleSubmit}
        onCancel={onClose}
        submitLabel={editing ? "Save changes" : "Create product"}
      />
    </Drawer>
  );
}
