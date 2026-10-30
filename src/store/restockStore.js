import { create } from "zustand";
import { persist } from "zustand/middleware";

// The restock queue is shared by Dashboard, Products, Product detail and the Restock page.
// That is exactly the case for a global store. It is saved to localStorage, so it survives a refresh.
export const suggestedQty = (stock) => Math.max(10, 40 - (Number(stock) || 0));

export const useRestock = create()(
  persist(
    (set) => ({
      items: {},
      add: (p) =>
        set((s) =>
          s.items[p.id]
            ? s
            : {
                items: {
                  ...s.items,
                  [p.id]: {
                    id: p.id,
                    title: p.title,
                    thumbnail: p.thumbnail ?? null,
                    price: p.price,
                    stock: p.stock,
                    qty: suggestedQty(p.stock),
                  },
                },
              },
        ),
      remove: (id) =>
        set((s) => {
          const { [id]: _gone, ...rest } = s.items;
          return { items: rest };
        }),
      setQty: (id, qty) =>
        set((s) => {
          const line = s.items[id];
          return line ? { items: { ...s.items, [id]: { ...line, qty: Math.min(9999, Math.max(1, Math.round(qty) || 1)) } } } : s;
        }),
      clear: () => set({ items: {} }),
    }),
    { name: "meridian-restock" },
  ),
);

// Selector helpers keep components from re-rendering when unrelated items change.
export const useQueueCount = () => useRestock((s) => Object.keys(s.items).length);

export const useInQueue = (id) => useRestock((s) => Boolean(s.items[id]));
