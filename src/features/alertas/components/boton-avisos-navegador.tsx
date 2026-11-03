import { useState } from 'react'

import { Button } from '@/components/ui/button'

type Permiso = NotificationPermission | 'no-soportado'

function permisoActual(): Permiso {
  return typeof Notification === 'undefined' ? 'no-soportado' : Notification.permission
}

/**
 * Permite al familiar activar las notificaciones del sistema para las
 * alertas en vivo. El navegador exige que el permiso se pida tras un clic.
 */
export function BotonAvisosNavegador() {
  const [permiso, setPermiso] = useState<Permiso>(permisoActual)

  if (permiso === 'no-soportado' || permiso === 'granted') return null

  if (permiso === 'denied') {
    return (
      <p className="text-xs text-salvia-700">
        Las notificaciones del navegador están bloqueadas para este sitio.
      </p>
    )
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => {
        void Notification.requestPermission().then(setPermiso)
      }}
    >
      Activar notificaciones del navegador
    </Button>
  )
}
