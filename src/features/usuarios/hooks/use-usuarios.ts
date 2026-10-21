import { useQuery } from '@tanstack/react-query'

import { usuariosApi } from '../api/usuarios.api'
import type { FiltrosUsuarios, UsuarioLista } from '../types'

/** Claves de cache de la feature (convención de AGENTS.md). */
export const clavesUsuarios = {
  todos: ['usuarios'] as const,
  lista: (filtros?: FiltrosUsuarios) => ['usuarios', filtros ?? {}] as const,
  roles: ['roles'] as const,
}

/** GET /usuarios — lista (opcionalmente filtrada) de usuarios. */
export function useUsuarios(filtros?: FiltrosUsuarios) {
  return useQuery({
    queryKey: clavesUsuarios.lista(filtros),
    queryFn: () => usuariosApi.listar(filtros),
  })
}

/** GET /roles — catálogo de roles para formularios. */
export function useRoles() {
  return useQuery({
    queryKey: clavesUsuarios.roles,
    queryFn: () => usuariosApi.listarRoles(),
  })
}

/** GET /usuarios?rol=ADULTO_MAYOR — adultos para el panel admin de ubicaciones. */
export function useAdultos(enabled = true) {
  return useQuery<UsuarioLista[]>({
    queryKey: clavesUsuarios.lista({ rol: 'ADULTO_MAYOR' }),
    queryFn: () => usuariosApi.listarAdultos(),
    enabled,
  })
}
