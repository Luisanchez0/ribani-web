import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { contactosApi } from '../api/contactos.api'
import type { ActualizarContacto, CrearContacto, FiltrosContactos } from '../types'

export const clavesContactos = {
  todos: ['contactos'] as const,
  lista: (filtros?: FiltrosContactos) => ['contactos', filtros ?? {}] as const,
  detalle: (id: string) => ['contactos', id] as const,
}

/** GET /contactos — lista de contactos de emergencia. */
export function useContactos(filtros?: FiltrosContactos) {
  return useQuery({
    queryKey: clavesContactos.lista(filtros),
    queryFn: () => contactosApi.listar(filtros),
  })
}

/** GET /contactos/{id} — detalle de un contacto. */
export function useContacto(id: string) {
  return useQuery({
    queryKey: clavesContactos.detalle(id),
    queryFn: () => contactosApi.obtener(id),
  })
}

/** POST /contactos — crea un contacto de emergencia. */
export function useCrearContacto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (datos: CrearContacto) => contactosApi.crear(datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesContactos.todos })
    },
  })
}

/** PATCH /contactos/{id} — actualiza datos editables de un contacto. */
export function useActualizarContacto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: ActualizarContacto }) =>
      contactosApi.actualizar(id, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesContactos.todos })
    },
  })
}

/** DELETE /contactos/{id} — baja de un contacto. */
export function useEliminarContacto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => contactosApi.eliminar(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesContactos.todos })
    },
  })
}
