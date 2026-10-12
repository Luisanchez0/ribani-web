import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { dispositivosApi } from '../api/dispositivos.api'
import type {
  ActualizarDispositivo,
  CrearDispositivo,
  FiltrosDispositivos,
} from '../types'

export const clavesDispositivos = {
  todos: ['dispositivos'] as const,
  lista: (filtros?: FiltrosDispositivos) =>
    ['dispositivos', filtros ?? {}] as const,
  detalle: (id: string) => ['dispositivos', id] as const,
}

/** GET /dispositivos — lista de dispositivos registrados. */
export function useDispositivos(filtros?: FiltrosDispositivos) {
  return useQuery({
    queryKey: clavesDispositivos.lista(filtros),
    queryFn: () => dispositivosApi.listar(filtros),
  })
}

/** GET /dispositivos/{id} — detalle de un dispositivo. */
export function useDispositivo(id: string) {
  return useQuery({
    queryKey: clavesDispositivos.detalle(id),
    queryFn: () => dispositivosApi.obtener(id),
  })
}

/** POST /dispositivos — registra un dispositivo. */
export function useRegistrarDispositivo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (datos: CrearDispositivo) => dispositivosApi.registrar(datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesDispositivos.todos })
    },
  })
}

/** PATCH /dispositivos/{id} — actualiza datos editables del dispositivo. */
export function useActualizarDispositivo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      datos,
    }: {
      id: string
      datos: ActualizarDispositivo
    }) => dispositivosApi.actualizar(id, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesDispositivos.todos })
    },
  })
}

/** DELETE /dispositivos/{id} — baja de un dispositivo. */
export function useEliminarDispositivo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => dispositivosApi.eliminar(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesDispositivos.todos })
    },
  })
}
