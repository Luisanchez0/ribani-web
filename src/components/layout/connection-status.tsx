import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

function isOnline() {
  return navigator.onLine
}

export function ConnectionStatus() {
  const online = useSyncExternalStore(subscribe, isOnline)

  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      {!online && (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm/6 text-amber-950 sm:px-6">
          <p className="mx-auto max-w-7xl">
            <strong className="font-bold">Sin conexión.</strong>{' '}
            Los datos y las alertas no se actualizan. Necesitas conexión para
            iniciar sesión o guardar cambios.
          </p>
        </div>
      )}
    </div>
  )
}
