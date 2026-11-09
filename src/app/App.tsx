import { ConnectionStatus } from '@/components/layout/connection-status'

import { AppProviders } from './providers'
import { AppRouter } from './router'

export function App() {
  return (
    <>
      <ConnectionStatus />
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </>
  )
}
