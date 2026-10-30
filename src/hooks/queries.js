import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchActivity,
  fetchCategories,
  fetchOrders,
  fetchProduct,
  fetchProducts,
  fetchSummary,
  fetchUsers,
  suggestProducts,
} from "../services/api";

// Query keys are the "address" of cached data. Keeping them in one place means
// invalidating ["products"] refreshes every list, detail and total at once.
export const productKeys = {
  all: ["products"],
  list: (query) => ["products", "list", query],
  detail: (id) => ["products", "detail", String(id)],
  suggest: (q) => ["products", "suggest", q],
};
/** Paged list (table / grid with page buttons). */
export function useProductList(query, enabled = true) {
  return useQuery({
    enabled,
    queryKey: productKeys.list(query),
    queryFn: ({ signal }) => fetchProducts(query, signal),
    placeholderData: keepPreviousData, // keep the old page on screen while the next one loads
  });
}

export const useCategories = () =>
  useQuery({ queryKey: ["categories"], queryFn: ({ signal }) => fetchCategories(signal), staleTime: 5 * 60_000 });
// Find a product we already downloaded in any cached list.
function findInCaches(caches, id) {
  for (const [, data] of caches) {
    const hit = data?.items?.find((p) => String(p.id) === id);
    if (hit) return hit;
  }
  return undefined;
}

export function useProduct(id) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: productKeys.detail(id ?? ""),
    queryFn: ({ signal }) => fetchProduct(id, signal),
    enabled: Boolean(id),
    // Show the little we already know (from a list we visited) instantly,
    // while the full product loads in the background.
    placeholderData: () => findInCaches(queryClient.getQueriesData({ queryKey: ["products"] }), String(id)),
  });
}

export function useProductSuggest(q) {
  const term = q.trim();
  return useQuery({
    queryKey: productKeys.suggest(term),
    queryFn: ({ signal }) => suggestProducts(term, signal),
    enabled: term.length >= 2,
    staleTime: 30_000,
  });
}

// Hover a row and we start loading its detail page before you even click.
export function usePrefetchProduct() {
  const queryClient = useQueryClient();
  return (id) =>
    queryClient.prefetchQuery({
      queryKey: productKeys.detail(id),
      queryFn: ({ signal }) => fetchProduct(id, signal),
      staleTime: 60_000,
    });
}

export const useOrders = (query) =>
  useQuery({ queryKey: ["orders", query], queryFn: ({ signal }) => fetchOrders(query, signal), placeholderData: keepPreviousData });
export const useSummary = () => useQuery({ queryKey: ["summary"], queryFn: ({ signal }) => fetchSummary(signal), staleTime: 30_000 });

export const useActivity = () => useQuery({ queryKey: ["activity"], queryFn: ({ signal }) => fetchActivity(signal), staleTime: 15_000 });

export const useUsers = () => useQuery({ queryKey: ["users"], queryFn: ({ signal }) => fetchUsers(signal) });
