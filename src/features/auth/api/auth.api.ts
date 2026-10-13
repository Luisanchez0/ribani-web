import { apiClient } from '@/lib/api-client'

import type {
  CredencialesLogin,
  DatosRegistro,
  RefrescoSesion,
  RespuestaLogin,
} from '../types'


export const authApi = {
  login(credenciales: CredencialesLogin): Promise<RespuestaLogin> {
    return apiClient
      .post<RespuestaLogin>('/auth/login', credenciales)
      .then((response) => response.data)
  },

  logout(refresco: RefrescoSesion): Promise<void> {
    return apiClient
      .post<void>('/auth/logout', refresco)
      .then(() => undefined)
  },

  register(datos: DatosRegistro): Promise<unknown> {
    return apiClient
      .post<unknown>('/auth/register', datos)
      .then((response) => response.data)
  },
}
