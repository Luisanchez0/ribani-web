import { useEffect, useRef, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { abrirStreamSse } from '@/lib/sse'
import { useAuthStore } from '@/stores/auth-store'

import { clavesAlertas } from '../api/alertas.api'

type EstadoConexion = 'conectando' | 'conectado' | 'error'

/** Estado agregado de todas las conexiones del panel. */
export type EstadoPanelAlertas = EstadoConexion | 'desconectado'

type EstadoPorAdulto = Record<string, EstadoConexion>

/**
 * Estado agregado del panel: el adulto sin reporte aún cuenta como
 * 'conectando' (su conexión se está abriendo). 'desconectado' solo
 * cuando no hay conexiones que administrar.
 */
function derivarEstado(
  ids: string[],
  estados: EstadoPorAdulto,
): EstadoPanelAlertas {
  if (ids.length === 0) return 'desconectado'
  const valores = ids.map((id) => estados[id] ?? 'conectando')
  if (valores.every((valor) => valor === 'conectado')) return 'conectado'
  if (valores.some((valor) => valor === 'conectado')) return 'conectado'
  if (valores.some((valor) => valor === 'error')) return 'error'
  return 'conectando'
}

/**
 * GET /alertas/stream?adultoId=… (SSE, autorización por Bearer), una
 * conexión por cada adulto vinculado ACTIVA del usuario con sesión.
 *
 * El backend emite cada creación y cada cambio de estado de alerta del
 * adulto (AlertasService.emitir, mismo canal que alimenta la creación);
 * aquí solo invalidamos la cache de react-query de 'alertas' para que la
 * tabla del panel relea GET /alertas con el shape completo (alertas,
 * bitácora, resumen WhatsApp). Validar el payload con JSON.parse evita
 * romper la conexión ante eventos corruptos.
 *
 * - encapsula las conexiones y su cleanup al desmontar
 * - reconexión con backoff simple ante caídas de red (igual que el hook
 *   de ubicaciones)
 * - sin token en la URL (ver AGENTS.md — SSE)
 * - los estados solo se actualizan desde callbacks asíncronos (open/
 *   message/error/timeout de reconexión); el estado de arranque se
 *   deriva en el render, así el efecto nunca llama a setState de forma
 *   sincrónica (react-hooks/set-state-in-effect)
 */
export function useAlertasStream(adultoIds: string[]) {
  const queryClient = useQueryClient()
  const token = useAuthStore((state) => state.token)
  const sessionRevision = useAuthStore((state) => state.sessionRevision)
  // Clave estable para no reabrir conexiones en cada render.
  const claveIds = adultoIds.join(',')
  const [estadosPorAdulto, setEstadosPorAdulto] = useState<EstadoPorAdulto>({})
  const cerrarStreams = useRef<Array<() => void>>([])
  const temporizadores = useRef<Array<ReturnType<typeof setTimeout>>>([])

  useEffect(() => {
    const ids = claveIds ? claveIds.split(',') : []
    if (ids.length === 0 || !useAuthStore.getState().token) {
      return
    }

    let abortado = false

    const marcarEstado = (adultoId: string, estado: EstadoConexion) => {
      if (abortado) return
      setEstadosPorAdulto((previo) =>
        previo[adultoId] === estado ? previo : { ...previo, [adultoId]: estado },
      )
    }

    // Coalesce ráfagas (crear + actualizar emiten casi seguido): como el
    // backend escribe en Postgres antes de emitir, un refetch lanzado un
    // instante después ya incluye ambos cambios.
    let ultimaInvalidacion = 0
    const invalidarAlertas = () => {
      const ahora = Date.now()
      if (ahora - ultimaInvalidacion < 250) return
      ultimaInvalidacion = ahora
      void queryClient.invalidateQueries({ queryKey: clavesAlertas.todos })
    }

    const conectar = (adultoId: string, reintento = 0): void => {
      if (abortado) return

      cerrarStreams.current.push(
        abrirStreamSse(
          `/alertas/stream?adultoId=${encodeURIComponent(adultoId)}`,
          {
            onOpen: () => marcarEstado(adultoId, 'conectado'),
            onMessage: (evento) => {
              if (abortado) return
              // El backend emite type: 'alerta' (array inicial u objeto).
              if (evento.event && evento.event !== 'alerta') return
              try {
                JSON.parse(evento.data)
              } catch {
                return // payload inválido: ignorar sin romper la conexión
              }
              marcarEstado(adultoId, 'conectado')
              invalidarAlertas()
            },
            onError: () => {
              if (abortado) return
              marcarEstado(adultoId, 'error')

              // Backoff: 1s, 2s, 4s… máx 15s. fetch-event-source corta su
              // reintento automático; la reconexión la maneja este hook
              // (el reintento corre en un timer: callback asíncrono).
              const espera = Math.min(1000 * 2 ** reintento, 15_000)
              temporizadores.current.push(
                setTimeout(() => conectar(adultoId, reintento + 1), espera),
              )
            },
          },
        ),
      )
    }

    ids.forEach((id) => conectar(id))

    return () => {
      abortado = true
      temporizadores.current.forEach((t) => clearTimeout(t))
      temporizadores.current = []
      cerrarStreams.current.forEach((cerrar) => cerrar())
      cerrarStreams.current = []
    }
  }, [claveIds, queryClient, sessionRevision])

  const estado: EstadoPanelAlertas =
    adultoIds.length === 0 || !token
      ? 'desconectado'
      : derivarEstado(adultoIds, estadosPorAdulto)

  return { estado }
}
