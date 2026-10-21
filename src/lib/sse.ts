import {
  fetchEventSource,
  EventStreamContentType,
} from '@microsoft/fetch-event-source'

import { env } from '@/config/env'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Tiempo real de RIBANI (ver AGENTS.md):
 * - nunca `EventSource` nativo (no permite headers)
 * - el token viaja SOLO en el header `Authorization`, jamás en la URL
 * - devuelve la función de cleanup para cerrar la conexión al desmontar
 *
 * Uso esperado desde un hook de feature:
 *   useEffect(() => abrirStreamSse('/ubicaciones/stream', { … }), [])
 */

export type EventoSse = {
  event: string
  id: string
  data: string
}

export type OpcionesSse = {
  onOpen?: () => void
  onMessage?: (evento: EventoSse) => void
  onClose?: () => void
  onError?: (error: unknown) => void
}

export function abrirStreamSse(
  path: string,
  opciones: OpcionesSse = {},
): () => void {
  const controller = new AbortController()
  const { token, sessionRevision } = useAuthStore.getState()
  if (!token) return () => undefined
  const unsubscribe = useAuthStore.subscribe((state) => {
    if (state.sessionRevision !== sessionRevision) controller.abort()
  })
  const cerrar = () => {
    controller.abort()
    unsubscribe()
  }

  // Diferencia con axios (api-client normaliza la unión baseURL+url): con
  // fetch nativo, apiUrl='http://host:3000/' + path='/x' produce dobles
  // slashes y el backend (rutas de raíz) responde 404. new URL(path, base)
  // resuelve '/x' relativo a la base sin duplicar la barra.
  const url = new URL(path, env.apiUrl.endsWith('/') ? env.apiUrl : `${env.apiUrl}/`)

  void fetchEventSource(url.toString(), {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: controller.signal,
    // Es un panel de monitoreo: los eventos deben seguir llegando
    // aunque la pestaña quede en segundo plano.
    openWhenHidden: true,
    onopen: async (response) => {
      if (controller.signal.aborted) return
      const autorizado =
        response.ok &&
        response.headers.get('content-type')?.includes(EventStreamContentType)

      if (autorizado) {
        opciones.onOpen?.()
        return
      }

      // 401/403 no se reintentan: cortar la conexión.
      throw new Error(`SSE respondió ${response.status}`)
    },
    onmessage: (evento) => {
      if (!controller.signal.aborted) opciones.onMessage?.(evento)
    },
    onclose: () => {
      if (!controller.signal.aborted) opciones.onClose?.()
    },
    onerror: (error) => {
      if (controller.signal.aborted) throw error
      opciones.onError?.(error)
      // Al relanzar el error se detiene el reintento automático de
      // fetch-event-source; la reconexión queda a cargo del hook de la
      // feature (así puede decidir backoff o pedir un token fresco).
      throw error
    },
  })
    // onerror ya entrega el fallo al hook; consumir el rechazo evita uno global.
    .catch(() => undefined)
    .finally(unsubscribe)

  return cerrar
}
