import { useEffect, useState, type ReactNode } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { restaurarSesion } from '@/lib/api-client'

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let active = true
    void restaurarSesion().finally(() => { if (active) setReady(true) })
    return () => { active = false }
  }, [])

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner label="Restaurando sesión" /></div>
  }
  return children
}
