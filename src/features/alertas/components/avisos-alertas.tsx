import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { ROL_ADMINISTRADOR } from '@/app/guards/require-role'
import { useMisAdultos } from '@/features/familiares'
import { IconoAlertas } from '@/lib/iconos'
import { useAuthStore } from '@/stores/auth-store'

import type { Alerta } from '../api/alertas.api'
import { AlertasEnVivoContext } from '../hooks/use-alertas-en-vivo'
import { useAlertasStream } from '../hooks/use-alertas-stream'

/** Máximo de avisos visibles a la vez; los más antiguos se descartan. */
const MAX_AVISOS = 3

type Aviso = {
  alerta: Alerta
  adulto: string
}

function textoAviso({ alerta, adulto }: Aviso): string {
  return alerta.tipo === 'SALIDA_ZONA'
    ? `${adulto} salió de su zona segura.`
    : `${alerta.titulo} — ${adulto}`
}

/** Notificación del sistema: solo si el familiar ya concedió el permiso. */
function notificarNavegador(aviso: Aviso) {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  try {
    new Notification('RIBANI · Alerta', {
      body: aviso.alerta.descripcion ?? textoAviso(aviso),
      tag: aviso.alerta.id,
      requireInteraction: aviso.alerta.severidad === 'CRITICA',
    })
  } catch {
    // Algunos navegadores (Android) solo permiten notificar desde un
    // service worker: el aviso en pantalla sigue mostrándose.
  }
}

/**
 * Mantiene, para todo el panel familiar, el stream SSE de alertas de los
 * adultos vinculados y avisa en cualquier pantalla cuando llega una alerta
 * nueva (salida de zona segura, caída, SOS…). El backend detecta la salida
 * de zona al recibir cada ubicación; aquí solo se presenta el aviso.
 */
export function AvisosAlertasProvider({ children }: { children: ReactNode }) {
  const usuario = useAuthStore((state) => state.usuario)
  const esFamiliar = !!usuario && usuario.rol.codigo !== ROL_ADMINISTRADOR
  const misAdultos = useMisAdultos(esFamiliar)
  const [avisos, setAvisos] = useState<Aviso[]>([])

  const adultosActivos = useMemo(
    () =>
      esFamiliar
        ? (misAdultos.data ?? []).filter((adulto) => adulto.estado === 'ACTIVA')
        : [],
    [esFamiliar, misAdultos.data],
  )
  const ids = useMemo(() => adultosActivos.map((a) => a.id), [adultosActivos])

  const onAlertaNueva = useCallback(
    (alerta: Alerta) => {
      const vinculado = adultosActivos.find((a) => a.id === alerta.adulto_id)
      const aviso: Aviso = {
        alerta,
        adulto: vinculado ? `${vinculado.nombre} ${vinculado.apellido}` : 'El adulto mayor',
      }
      setAvisos((previos) =>
        [aviso, ...previos.filter((p) => p.alerta.id !== alerta.id)].slice(0, MAX_AVISOS),
      )
      notificarNavegador(aviso)
    },
    [adultosActivos],
  )

  const stream = useAlertasStream(ids, onAlertaNueva)

  const descartar = (id: string) =>
    setAvisos((previos) => previos.filter((p) => p.alerta.id !== id))

  return (
    <AlertasEnVivoContext.Provider value={stream.estado}>
      {children}

      <div
        aria-live="assertive"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:left-auto sm:w-96"
      >
        {avisos.map((aviso) => {
          const { alerta } = aviso
          const esZona = alerta.tipo === 'SALIDA_ZONA'
          return (
            <div
              key={alerta.id}
              role="alert"
              className="pointer-events-auto w-full rounded-lg border-l-4 border-red-600 bg-white p-4 shadow-lg ring-1 ring-red-200"
            >
              <div className="flex items-start gap-3">
                <IconoAlertas size={22} className="mt-0.5 shrink-0 text-red-700" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-red-800">
                    {esZona ? 'Salida de zona segura' : alerta.titulo}
                  </p>
                  <p className="mt-1 text-sm text-pino-900">{textoAviso(aviso)}</p>
                  {alerta.descripcion && (
                    <p className="mt-1 text-xs text-salvia-700">{alerta.descripcion}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      to="/panel/alertas"
                      onClick={() => descartar(alerta.id)}
                      className="rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
                    >
                      Ver alerta
                    </Link>
                    {esZona && (
                      <Link
                        to="/panel/ubicaciones"
                        onClick={() => descartar(alerta.id)}
                        className="rounded-md border border-salvia-300 px-3 py-1.5 text-sm font-medium text-pino-900 hover:bg-salvia-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
                      >
                        Ver ubicación
                      </Link>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => descartar(alerta.id)}
                  className="rounded-md p-1 text-salvia-600 hover:bg-salvia-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pino-600"
                  aria-label="Cerrar aviso"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </AlertasEnVivoContext.Provider>
  )
}
