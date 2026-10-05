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
  const token = useAuthStore.getState().token

  void fetchEventSource(`${env.apiUrl}${path}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: controller.signal,
    // Es un panel de monitoreo: los eventos deben seguir llegando
    // aunque la pestaña quede en segundo plano.
    openWhenHidden: true,
    onopen: async (response) => {
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
      opciones.onMessage?.(evento)
    },
    onclose: () => {
      opciones.onClose?.()
    },
    onerror: (error) => {
      opciones.onError?.(error)
      // Al relanzar el error se detiene el reintento automático de
      // fetch-event-source; la reconexión queda a cargo del hook de la
      // feature (así puede decidir backoff o pedir un token fresco).
      throw error
    },
  })

  return () => controller.abort()
}
