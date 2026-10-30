import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  clearWorkspaceData,
  createOrder,
  createProduct,
  createUser,
  loadDemoData,
  deleteProduct,
  patchUser,
  placeRestock,
  updateOrderStatus,
  updateProduct,
} from "../services/api";
import { toast } from "../store/toastStore";
import { productKeys } from "./queries";
/* Cache helpers: they know the two shapes our product cache can hold
   (a Page of products, or one Product) and keep that shape. */
const isPage = (v) => Boolean(v) && Array.isArray(v.items) && typeof v.total === "number";

const isProduct = (v) => Boolean(v) && typeof v.sku === "string";

export function patchProductsCache(old, id, patch) {
  const mapPage = (page) => ({ ...page, items: page.items.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  if (isPage(old)) return mapPage(old);
  if (isProduct(old) && old.id === id) return { ...old, ...patch };
  return old;
}

export function removeFromProductsCache(old, id) {
  const dropFrom = (page) => {
    const items = page.items.filter((p) => p.id !== id);
    return { ...page, items, total: page.total - (page.items.length - items.length) };
  };
  if (isPage(old)) return dropFrom(old);
  return old;
}

async function snapshotAndPatch(queryClient, key, apply) {
  await queryClient.cancelQueries({ queryKey: key }); // stop in-flight fetches overwriting us
  const snapshot = queryClient.getQueriesData({ queryKey: key });
  queryClient.setQueriesData({ queryKey: key }, apply);
  return snapshot;
}

const rollback = (queryClient, snapshot) => snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data));

// Anything that changes products also changes dashboard numbers and the activity feed.
const refreshProductData = (queryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: productKeys.all }),
    queryClient.invalidateQueries({ queryKey: ["summary"] }),
    queryClient.invalidateQueries({ queryKey: ["activity"] }),
    queryClient.invalidateQueries({ queryKey: ["categories"] }),
  ]);
/**
 * OPTIMISTIC UPDATE, step by step:
 *  1. onMutate  - change the screen immediately, remember the old cache (snapshot)
 *  2. server answers
 *  3. onError   - put the snapshot back and tell the user
 *  4. onSettled - refetch so the screen matches the server again
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }) => updateProduct(id, patch),
    onMutate: async ({ id, patch }) => ({
      snapshot: await snapshotAndPatch(queryClient, productKeys.all, (old) => patchProductsCache(old, id, patch)),
    }),
    onError: (error, _vars, context) => {
      rollback(queryClient, context?.snapshot);
      toast.error("Change rolled back", error.message);
    },
    onSettled: () => refreshProductData(queryClient),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => deleteProduct(id),
    onMutate: async ({ id }) => ({
      snapshot: await snapshotAndPatch(queryClient, productKeys.all, (old) => removeFromProductsCache(old, id)),
    }),
    onError: (error, _vars, context) => {
      rollback(queryClient, context?.snapshot);
      toast.error("Couldn't delete product", error.message);
    },
    onSettled: () => refreshProductData(queryClient),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (values) => createProduct(values), onSuccess: () => refreshProductData(queryClient) });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => updateOrderStatus(id, status),
    onMutate: async ({ id, status }) => ({
      snapshot: await snapshotAndPatch(queryClient, ["orders"], (old) => {
        const data = old;
        return data?.items ? { ...data, items: data.items.map((o) => (o.id === id ? { ...o, status } : o)) } : old;
      }),
    }),
    onError: (error, _vars, context) => {
      rollback(queryClient, context?.snapshot);
      toast.error("Couldn't update the order", error.message);
    },
    onSettled: () => Promise.all(["orders", "summary", "activity"].map((k) => queryClient.invalidateQueries({ queryKey: [k] }))),
  });
}

export function useRestockMutation() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (items) => placeRestock(items), onSuccess: () => refreshProductData(queryClient) });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () =>
      Promise.all([queryClient.invalidateQueries({ queryKey: ["users"] }), queryClient.invalidateQueries({ queryKey: ["activity"] })]),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }) => patchUser(id, patch),
    onSuccess: () =>
      Promise.all([queryClient.invalidateQueries({ queryKey: ["users"] }), queryClient.invalidateQueries({ queryKey: ["activity"] })]),
    onError: (error) => toast.error("Couldn't update the user", error.message),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  // An order changes orders, product stock, dashboard numbers and the activity feed.
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => Promise.all([queryClient.invalidateQueries({ queryKey: ["orders"] }), refreshProductData(queryClient)]),
  });
}

// Clearing or loading the sample data changes EVERYTHING on screen, so refresh every query.
export function useClearData() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: clearWorkspaceData, onSuccess: () => queryClient.invalidateQueries() });
}

export function useLoadDemo() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: loadDemoData, onSuccess: () => queryClient.invalidateQueries() });
}
