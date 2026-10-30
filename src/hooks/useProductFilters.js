import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { PAGE_SIZE } from "../services/api";

export const SORT_OPTIONS = [
  { value: "relevance", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating-desc", label: "Top rated" },
  { value: "stock-asc", label: "Stock: lowest first" },
  { value: "stock-desc", label: "Stock: highest first" },
  { value: "title-asc", label: "Name: A to Z" },
];

const DEFAULTS = { q: "", category: "", stock: "all", sort: "relevance", page: 1, view: "table" };

const STOCKS = ["all", "low", "out"];

// The filters live in the URL (?q=phone&category=laptops&page=2), not in component state.
// Result: the Back button works, and you can copy the link to share the exact view.
export function useProductFilters() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => {
    const stock = params.get("stock");
    const sort = params.get("sort");
    return {
      q: params.get("q") ?? "",
      category: params.get("category") ?? "",
      stock: STOCKS.includes(stock) ? stock : "all",
      sort: SORT_OPTIONS.some((o) => o.value === sort) ? sort : "relevance",
      page: Math.max(1, parseInt(params.get("page") || "1", 10) || 1),
      view: params.get("view") === "grid" ? "grid" : "table",
      pageSize: PAGE_SIZE,
    };
  }, [params]);
  const update = useCallback(
    (patch, { keepPage = false } = {}) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(patch).forEach(([key, value]) => {
            if (value === undefined || value === null || value === "" || value === DEFAULTS[key]) next.delete(key);
            else next.set(key, String(value));
          });
          if (!keepPage && !("page" in patch)) next.delete("page"); // any new filter goes back to page 1
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );
  // Only the fields the SERVER cares about. (Table or grid view is only a display choice, so changing it must not refetch.)
  const query = useMemo(
    () => ({
      q: filters.q,
      category: filters.category,
      stock: filters.stock,
      sort: filters.sort,
      page: filters.page,
      pageSize: filters.pageSize,
    }),
    [filters.q, filters.category, filters.stock, filters.sort, filters.page, filters.pageSize],
  );
  const clear = useCallback(() => setParams({}, { replace: true }), [setParams]);
  const isFiltered = Boolean(filters.q || filters.category || filters.stock !== "all" || filters.sort !== "relevance");
  return { filters, query, update, clear, isFiltered };
}
