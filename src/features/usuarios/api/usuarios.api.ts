import { apiClient } from '@/lib/api-client'

import type {
  ActualizarUsuario,
  CrearUsuario,
  FiltrosUsuarios,
  RolLista,
  UsuarioLista,
} from '../types'


export const usuariosApi = {
  listar(filtros?: FiltrosUsuarios): Promise<UsuarioLista[]> {
    return apiClient
      .get<UsuarioLista[]>('/usuarios', { params: filtros })
      .then((response) => response.data)
  },

  obtener(id: string): Promise<UsuarioLista> {
    return apiClient
      .get<UsuarioLista>(`/usuarios/${id}`)
      .then((response) => response.data)
  },

  crear(datos: CrearUsuario): Promise<void> {
    return apiClient
      .post('/usuarios', datos)
      .then(() => undefined)
  },

  actualizar(id: string, datos: ActualizarUsuario): Promise<void> {
    return apiClient
      .patch(`/usuarios/${id}`, datos)
      .then(() => undefined)
  },

  desactivar(id: string): Promise<void> {
    return apiClient
      .patch(`/usuarios/${id}/desactivar`)
      .then(() => undefined)
  },

  activar(id: string): Promise<void> {
    return apiClient
      .patch(`/usuarios/${id}/activar`)
      .then(() => undefined)
  },

  eliminar(id: string): Promise<void> {
    return apiClient
      .delete(`/usuarios/${id}`)
      .then(() => undefined)
  },

  listarRoles(): Promise<RolLista[]> {
    return apiClient
      .get<RolLista[]>('/roles')
      .then((response) => response.data)
  },

  /** GET /usuarios?rol=ADULTO_MAYOR — adultos para el panel de ubicaciones. */
  listarAdultos(): Promise<UsuarioLista[]> {
    return apiClient
      .get<UsuarioLista[]>('/usuarios', { params: { rol: 'ADULTO_MAYOR' } })
      .then((response) => response.data)
  },
}
