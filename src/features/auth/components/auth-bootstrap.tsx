import { useEffect, useState, type ReactNode } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { restaurarSesion } from '@/lib/api-client'

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)
  const [intento, setIntento] = useState(0)
  useEffect(() => {
    let active = true
    void restaurarSesion().then(
      () => { if (active) setReady(true) },
      () => { if (active) setError(true) },
    )
    return () => { active = false }
  }, [intento])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Alert variant="error">No pudimos comprobar tu sesión. Revisa tu conexión e inténtalo de nuevo.</Alert>
          <Button onClick={() => { setError(false); setIntento((actual) => actual + 1) }}>Reintentar</Button>
        </div>
      </div>
    )
  }

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner label="Restaurando sesión" /></div>
  }
  return children
}
