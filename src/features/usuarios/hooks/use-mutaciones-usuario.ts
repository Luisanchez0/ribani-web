import { useMutation, useQueryClient } from '@tanstack/react-query'

import { usuariosApi } from '../api/usuarios.api'
import type { ActualizarUsuario, CrearUsuario } from '../types'
import { clavesUsuarios } from './use-usuarios'


export function useCrearUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (datos: CrearUsuario) => usuariosApi.crear(datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesUsuarios.todos })
    },
  })
}

export function useActualizarUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      datos,
    }: {
      id: string
      datos: ActualizarUsuario
    }) => usuariosApi.actualizar(id, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesUsuarios.todos })
    },
  })
}

export function useDesactivarUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => usuariosApi.desactivar(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesUsuarios.todos })
    },
  })
}

export function useActivarUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => usuariosApi.activar(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesUsuarios.todos })
    },
  })
}
export function useEliminarUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => usuariosApi.eliminar(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clavesUsuarios.todos })
    },
  })
}
