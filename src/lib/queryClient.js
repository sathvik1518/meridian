import { QueryClient } from "@tanstack/react-query";

// One shared cache for the whole app.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // data stays "fresh" for a minute: no refetch while you click around
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      // Don't retry "not found" / "forbidden" style errors, they will not fix themselves.
      retry: (count, error) => {
        const status = error.status ?? 0;
        return status >= 400 && status < 500 ? false : count < 2;
      },
    },
  },
});
