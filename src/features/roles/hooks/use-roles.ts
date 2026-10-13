import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { rolesApi } from '../api/roles.api'
import type { ActualizarRol, AsignarPermisos } from '../types'

export const clavesRoles = {
  todos: ['roles'] as const,
  lista: ['roles', 'lista'] as const,
  detalle: (id: number) => ['roles', id] as const,
  permisos: ['roles', 'permisos'] as const,
}

export function useRoles() {
  return useQuery({
    queryKey: clavesRoles.lista,
    queryFn: () => rolesApi.listar(),
  })
}

export function useRol(id: number) {
  return useQuery({
    queryKey: clavesRoles.detalle(id),
    queryFn: () => rolesApi.obtener(id),
  })
}

export function usePermisos() {
  return useQuery({
    queryKey: clavesRoles.permisos,
    queryFn: () => rolesApi.listarPermisos(),
  })
}

export function useActualizarRol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ActualizarRol }) =>
      rolesApi.actualizar(id, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesRoles.todos })
    },
  })
}

export function useEliminarRol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => rolesApi.eliminar(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesRoles.todos })
    },
  })
}

export function useAsignarPermisos() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: AsignarPermisos }) =>
      rolesApi.asignarPermisos(id, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesRoles.todos })
    },
  })
}
