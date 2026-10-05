import { QueryClient } from '@tanstack/react-query'

/**
 * Estado y cache del servidor (ver AGENTS.md).
 * Los datos del backend NUNCA se copian a Zustand ni a useState.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
