import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'

import { queryClient } from '@/lib/query-client'
import { AuthBootstrap } from '@/features/auth'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap><BrowserRouter>{children}</BrowserRouter></AuthBootstrap>
    </QueryClientProvider>
  )
}
