import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { zonasSegurasApi } from '../api/zonas-seguras.api'
import type { ActualizarZonaSegura, CrearZonaSegura } from '../types'

export const clavesZonasSeguras = {
  todas: ['zonas-seguras'] as const,
  lista: (adultoId?: string, soloActivas = true) =>
    ['zonas-seguras', { adultoId: adultoId ?? null, soloActivas }] as const,
}

/** GET /zonas-seguras — zonas de los adultos accesibles (o de uno). */
export function useZonasSeguras(adultoId?: string, soloActivas = true) {
  return useQuery({
    queryKey: clavesZonasSeguras.lista(adultoId, soloActivas),
    queryFn: () => zonasSegurasApi.listar({ adultoId, soloActivas }),
  })
}

/** POST /zonas-seguras. */
export function useCrearZonaSegura() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (datos: CrearZonaSegura) => zonasSegurasApi.crear(datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesZonasSeguras.todas })
    },
  })
}

/** PATCH /zonas-seguras/{id}. */
export function useActualizarZonaSegura() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: ActualizarZonaSegura }) =>
      zonasSegurasApi.actualizar(id, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesZonasSeguras.todas })
    },
  })
}

/** DELETE /zonas-seguras/{id} — baja lógica. */
export function useEliminarZonaSegura() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => zonasSegurasApi.eliminar(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesZonasSeguras.todas })
    },
  })
}
