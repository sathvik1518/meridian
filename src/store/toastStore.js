import { create } from "zustand";
let nextId = 1;

export const useToastStore = create((set) => ({
  toasts: [],
  push: (toast) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { tone: "info", duration: 4500, ...toast, id }] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// Call these from anywhere, even outside React: toast.success("Saved")
const push = (tone) => (title, description) => useToastStore.getState().push({ tone, title, description });

export const toast = { success: push("ok"), error: push("bad"), info: push("info"), warn: push("warn") };
