import axios from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ubicacionesApi } from '../api/ubicaciones.api'
import type {
  FiltrosHistorial,
  RegistrarUbicacion,
  Ubicacion,
} from '../types'

/** Claves de cache de la feature (convención de AGENTS.md). */
export const clavesUbicaciones = {
  todos: ['ubicaciones'] as const,
  ultimas: ['ubicaciones', 'ultimas'] as const,
  actual: (adultoId: string) => ['ubicaciones', 'actual', adultoId] as const,
  historial: (filtros: FiltrosHistorial & { adultoId: string }) =>
    ['ubicaciones', 'historial', filtros] as const,
}


export function useUbicacionActual(adultoId: string, enabled = true) {
  return useQuery<Ubicacion | null>({
    queryKey: clavesUbicaciones.actual(adultoId),
    enabled: enabled && adultoId !== '',
    queryFn: async () => {
      try {
        return await ubicacionesApi.actual(adultoId)
      } catch (error) {
        // 404 = sin reporte todavía: no reintentar, resolver sin datos.
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return null
        }
        throw error
      }
    },
    retry: 2,
  })
}

/**
 * GET /ubicaciones/ultimas — una petición para pintar a todos los adultos en
 * el mapa del administrador. Se refresca cada 30 s para no depender de N SSE.
 */
export function useUltimasUbicaciones(enabled = true) {
  return useQuery({
    queryKey: clavesUbicaciones.ultimas,
    enabled,
    queryFn: () => ubicacionesApi.ultimas(),
    refetchInterval: 30_000,
  })
}

export function useHistorialUbicaciones(
  filtros: FiltrosHistorial & { adultoId: string },
) {
  return useQuery({
    queryKey: clavesUbicaciones.historial(filtros),
    queryFn: () => ubicacionesApi.historial(filtros),
  })
}

/** POST /ubicaciones — reportar ubicación (diagnóstico/demo). */
export function useReportarUbicacion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (datos: RegistrarUbicacion) => ubicacionesApi.reportar(datos),
    onSuccess: (ubicacion) => {
      // El propio reporte ya llega por el stream; sirve tanto para
      // actualizar la cache como para refrescar el historial.
      void queryClient.invalidateQueries({
        queryKey: clavesUbicaciones.todos,
      })
      void queryClient.setQueryData(
        clavesUbicaciones.actual(ubicacion.adulto_id),
        ubicacion,
      )
    },
  })
}
