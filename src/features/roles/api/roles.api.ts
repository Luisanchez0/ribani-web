import { apiClient } from '@/lib/api-client'

import type {
  ActualizarRol,
  AsignarPermisos,
  Permiso,
  RolDetalle,
  RolLista,
} from '../types'

/**
 * Endpoints reales del backend (ribani-server → RolesController):
 * - GET   /roles               (lista de roles con permisos anidados)
 * - GET   /roles/permisos      (catálogo de permisos)
 * - GET   /roles/{id}          (detalle de un rol)
 * - PATCH /roles/{id}          (UpdateRolDto: nombre, descripcion, activo)
 * - DELETE /roles/{id}         (eliminación del rol)
 * - PATCH /roles/{id}/permisos (AsignarPermisosDto: reemplaza el set completo)
 */
export const rolesApi = {
  listar(): Promise<RolLista[]> {
    return apiClient
      .get<RolLista[]>('/roles')
      .then((response) => response.data)
  },

  listarPermisos(): Promise<Permiso[]> {
    return apiClient
      .get<Permiso[]>('/roles/permisos')
      .then((response) => response.data)
  },

  obtener(id: number): Promise<RolDetalle> {
    return apiClient
      .get<RolDetalle>(`/roles/${id}`)
      .then((response) => response.data)
  },

  actualizar(id: number, datos: ActualizarRol): Promise<void> {
    return apiClient
      .patch(`/roles/${id}`, datos)
      .then(() => undefined)
  },

  /** DELETE /roles/{id} — eliminación definitiva del rol (sin body). */
  eliminar(id: number): Promise<void> {
    return apiClient
      .delete(`/roles/${id}`)
      .then(() => undefined)
  },

  /**
   * PATCH /roles/{id}/permisos — asigna los permisos del rol.
   * El backend reemplaza el set completo por el que se envía.
   */
  asignarPermisos(id: number, datos: AsignarPermisos): Promise<void> {
    return apiClient
      .patch(`/roles/${id}/permisos`, datos)
      .then(() => undefined)
  },
}
