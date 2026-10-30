import { create } from "zustand";
import { persist } from "zustand/middleware";

// Zustand = a tiny global store. We use it for UI state that many places read and
// change often. Only the pieces listed in `partialize` are saved to localStorage.
export const useUiStore = create()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileNavOpen: false,
      paletteOpen: false,
      simulateFailures: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileNav: (open) => set({ mobileNavOpen: open }),
      setPalette: (open) => set({ paletteOpen: open }),
      setSimulateFailures: (on) => set({ simulateFailures: on }),
    }),
    {
      name: "meridian-ui",
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, simulateFailures: s.simulateFailures }),
    },
  ),
);
