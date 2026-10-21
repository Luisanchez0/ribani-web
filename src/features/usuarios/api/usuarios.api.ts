import { apiClient } from '@/lib/api-client'
import type { components } from '@/types/api'

import type {
  ActualizarPerfil,
  ActualizarUsuario,
  CambiarPassword,
  CrearUsuario,
  FiltrosUsuarios,
  RolLista,
  UsuarioLista,
} from '../types'


export const usuariosApi = {
  obtenerMiPerfil(): Promise<UsuarioLista> {
    return apiClient
      .get<UsuarioLista>('/usuarios/perfil')
      .then((response) => response.data)
  },

  actualizarMiPerfil(datos: ActualizarPerfil): Promise<UsuarioLista> {
    return apiClient
      .patch<UsuarioLista>('/usuarios/perfil', datos)
      .then((response) => response.data)
  },

  cambiarMiPassword(
    datos: CambiarPassword,
  ): Promise<components['schemas']['PasswordActualizadaDto']> {
    return apiClient
      .patch<components['schemas']['PasswordActualizadaDto']>(
        '/usuarios/perfil/password',
        datos,
      )
      .then((response) => response.data)
  },

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
