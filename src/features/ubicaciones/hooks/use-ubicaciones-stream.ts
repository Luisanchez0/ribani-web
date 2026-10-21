import { useEffect, useRef, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { abrirStreamSse } from '@/lib/sse'
import { useAuthStore } from '@/stores/auth-store'

import { clavesUbicaciones } from './use-ubicaciones'
import type { EventoUbicacion } from '../types'

export type EstadoStream = 'conectando' | 'conectado' | 'error'

/**
 * Ajuste del payload del evento: los Decimal de Prisma (latitud,
 * longitud, precision_metros, altitud_metros) llegan como string en el
 * JSON del SSE; la UI trabaja con number.
 */
const mapearEvento = (cru: EventoUbicacion): EventoUbicacion => ({
  ...cru,
  latitud: Number(cru.latitud),
  longitud: Number(cru.longitud),
  precision_metros:
    cru.precision_metros === null ? null : Number(cru.precision_metros),
  altitud_metros:
    cru.altitud_metros === null ? null : Number(cru.altitud_metros),
})

/**
 * GET /ubicaciones/stream?adultoId=… (SSE, autorización por Bearer).
 *
 * - encapsula la conexión y su cleanup al desmontar
 * - reconexión con backoff simple ante caídas de red
 * - sin conexiones duplicadas: una sola por (adultoId, montaje)
 * - sin token en la URL (ver AGENTS.md — SSE)
 * - los eventos actualizan la cache de react-query de la ubicación
 *   actual del adulto; la UI no guarda estado de dominio extra
 */
export function useUbicacionesStream(adultoId: string) {
  const queryClient = useQueryClient()
  const sessionRevision = useAuthStore((state) => state.sessionRevision)
  const [estado, setEstado] = useState<EstadoStream>('conectando')
  const [ultimoEventoEn, setUltimoEventoEn] = useState<string | null>(null)
  // Referencia estable para no reabrir la conexión en cada render.
  const cerrarStream = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!adultoId || !useAuthStore.getState().token) return

    let reintentos = 0
    let temporizador: ReturnType<typeof setTimeout> | null = null
    let abortado = false

    // El token puede refrescarse (api-client): leerlo en cada intento.
    const conectar = () => {
      if (abortado) return

      setEstado('conectando')
      cerrarStream.current = abrirStreamSse(
        `/ubicaciones/stream?adultoId=${encodeURIComponent(adultoId)}`,
        {
          onOpen: () => {
            if (abortado) return
            reintentos = 0
            setEstado('conectado')
          },
          onMessage: (evento) => {
            if (abortado) return
            // El backend emite type: 'ubicacion' con JSON en data.
            if (evento.event && evento.event !== 'ubicacion') return

            try {
              const ubicacion = mapearEvento(
                JSON.parse(evento.data) as EventoUbicacion,
              )
              setUltimoEventoEn(ubicacion.registrada_en)

              queryClient.setQueryData(
                clavesUbicaciones.actual(adultoId),
                ubicacion,
              )
            } catch {
              // payload inválido: ignorar el evento sin romper la conexión
            }
          },
          onError: () => {
            if (abortado) return
            setEstado('error')
            cerrarStream.current = null

            // Backoff: 1s, 2s, 4s… máx 15s. fetch-event-source lanza el
            // error y corta su reintento automático; la reconexión la
            // maneja este hook.
            const espera = Math.min(1000 * 2 ** reintentos, 15_000)
            reintentos += 1
            if (temporizador) clearTimeout(temporizador)
            temporizador = setTimeout(conectar, espera)
          },
          onClose: () => {
            setEstado('error')
            cerrarStream.current = null
          },
        },
      )
    }

    conectar()

    return () => {
      abortado = true
      if (temporizador) clearTimeout(temporizador)
      cerrarStream.current?.()
      cerrarStream.current = null
    }
  }, [adultoId, queryClient, sessionRevision])

  return { estado, ultimoEventoEn }
}
